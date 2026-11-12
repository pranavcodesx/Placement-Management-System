"""Business rules of the placement system (eligibility, applying, placement policy)."""
import copy
import re
from django.utils import timezone
from .models import Activity, Application, Notification, Setting, StatusEvent, Student


def pk_numbers(package):
    return [float(x) for x in re.findall(r'[\d.]+', package or '')] or [0.0]


def pk_max(package):
    return max(pk_numbers(package))


def days_left(job):
    return (job.deadline - timezone.localdate()).days


def notify(student, text):
    Notification.objects.create(student=student, text=text)


def notify_job_candidates(job, kind, text, *, exclude_applied=False, skip_job_notified=False):
    """Bulk-notify eligible students while keeping job notices idempotent."""
    students = Student.objects.filter(status='Active', onboarded=True)
    if exclude_applied:
        students = students.exclude(pk__in=job.applications.values_list('student_id', flat=True))

    existing = Notification.objects.filter(job=job)
    if not skip_job_notified:
        existing = existing.filter(kind=kind)
    notified_ids = set(existing.values_list('student_id', flat=True))

    if skip_job_notified:
        prefix = f'New job opportunity: {job.title} at {job.company.name}'
        for notice in Notification.objects.filter(student__in=students, job__isnull=True, text__startswith=prefix).only('student_id', 'text'):
            if notice.text == prefix or notice.text.startswith(prefix + '. Apply before '):
                notified_ids.add(notice.student_id)

    notices = [
        Notification(student=student, job=job, kind=kind, text=text)
        for student in students.iterator()
        if student.pk not in notified_ids and eligibility(student, job)['ok']
    ]
    Notification.objects.bulk_create(notices, ignore_conflicts=True)
    return len(notices)


def log(text):
    Activity.objects.create(text=text)


def offer(student, exclude=None):
    """Highest package (LPA) the student has already been selected for."""
    qs = Application.objects.filter(student=student, status='Selected').select_related('job')
    if exclude:
        qs = qs.exclude(pk=exclude)
    return max([pk_max(a.job.package) for a in qs], default=0)


def eligibility(s, j):
    """Check every rule of a job against a student's profile."""
    have = {x['n'].lower() for x in s.skills}
    missing = [k for k in j.skills if k.lower() not in have]
    match = round((len(j.skills) - len(missing)) / len(j.skills) * 100) if j.skills else 100
    checks = {
        'dept': s.department in j.departments,
        'pct': s.percentage >= j.min_percentage,
        'p10': s.p10 >= j.min_10th,
        'p12': s.p12 >= j.min_12th,
        'bk': s.backlogs <= j.max_backlogs,
        'skills': match >= 60,
    }
    why = []
    if not checks['dept']: why.append('Your department is not eligible')
    if not checks['pct']: why.append(f'Needs {j.min_percentage:g}% (you have {s.percentage:g}%)')
    if not checks['p10']: why.append(f'Needs {j.min_10th:g}% in 10th')
    if not checks['p12']: why.append(f'Needs {j.min_12th:g}% in 12th / diploma')
    if not checks['bk']: why.append(f'Max {j.max_backlogs} backlog(s) allowed')
    if not checks['skills']: why.append('Skills match is below 60%')
    return {'ok': not why, 'checks': checks, 'match': match, 'missing': missing, 'why': why}


def skill_gap(s, jobs):
    """Rank missing skills across department-eligible open jobs."""
    eligible_jobs = [(j, eligibility(s, j)) for j in jobs]
    eligible_jobs = [(j, result) for j, result in eligible_jobs if result['checks']['dept']]
    missing = {}
    for j, result in eligible_jobs:
        seen = set()
        for skill in result['missing']:
            key = skill.lower()
            if key not in seen:
                missing.setdefault(key, {'skill': skill, 'jobs': []})['jobs'].append(j)
                seen.add(key)

    recommendations = []
    for key, item in missing.items():
        learned = copy.copy(s)
        learned.skills = [*s.skills, {'n': item['skill']}]
        more_jobs = 0
        for j in item['jobs']:
            current, updated = eligibility(s, j), eligibility(learned, j)
            if not current['checks']['skills'] and updated['checks']['skills']:
                more_jobs += 1
        recommendations.append({
            'skill': item['skill'],
            'job_count': len(item['jobs']),
            'job_titles': [j.title for j in item['jobs'][:3]],
            'more_jobs': more_jobs,
        })
    recommendations.sort(key=lambda item: (-item['job_count'], item['skill'].lower()))
    return recommendations[:8]


def rank_applicants(job):
    """Return a deterministic, weighted ranking of a job's applicants."""
    ranked = []
    applications = job.applications.select_related('student__user').prefetch_related(
        'student__projects', 'student__certs',
    )
    for application in applications:
        student = application.student
        skills = eligibility(student, job)['match'] * 0.5
        if job.min_percentage:
            graduation = min(student.percentage / job.min_percentage, 1) * 25
        else:
            graduation = student.percentage / 100 * 25
        school = (student.p10 + student.p12) / 2 * 0.1
        backlogs = max(0, 10 - student.backlogs)
        portfolio = min(student.projects.count() + student.certs.count(), 5)
        breakdown = {
            'skills': round(skills, 2),
            'graduation': round(graduation, 2),
            'school': round(school, 2),
            'backlogs': round(backlogs, 2),
            'portfolio': round(portfolio, 2),
        }
        ranked.append({
            'application_id': application.pk,
            'student_id': student.pk,
            'student_name': student.name,
            'department': student.department,
            'percentage': student.percentage,
            'status': application.status,
            'score': round(sum(breakdown.values())),
            'breakdown': breakdown,
        })
    return sorted(ranked, key=lambda item: (-item['score'], item['student_name'].casefold(), item['application_id']))


def can_apply(s, j):
    """Returns (True, '') or (False, reason). Same order of rules as the front-end."""
    if Application.objects.filter(student=s, job=j).exists():
        return False, 'You have already applied.'
    if days_left(j) < 0:
        return False, 'The application deadline has passed.'
    if not s.resume:
        return False, 'Upload your resume to apply.'
    e = eligibility(s, j)
    if not e['ok']:
        return False, e['why'][0] + '.'
    pol, o = Setting.get(), offer(s)
    if pol.one_offer and o and pk_max(j.package) < o * pol.dream_multiplier:
        return False, f'You are already placed (₹{o:g} LPA). Only dream offers ({pol.dream_multiplier:g}x or more) are open to you.'
    return True, ''


def set_status(app, new, notify_student=True):
    """Change application status. Returns an error message if the placement policy blocks it."""
    if app.status == new:
        return None
    s, j, pol = app.student, app.job, Setting.get()
    if new == 'Selected' and pol.one_offer:
        o = offer(s, exclude=app.pk)
        if o and pk_max(j.package) < o * pol.dream_multiplier:
            return f'{s.name} is already placed (₹{o:g} LPA). Policy allows only offers of {pol.dream_multiplier:g}x or more.'
    app.status = new
    app.save()
    StatusEvent.objects.create(application=app, status=new)
    if notify_student:
        notify(s, f'Your application for {j.title} at {j.company.name} is now {new}')
    log(f'{s.name}: {j.title} marked {new}')
    return None


def sections(s):
    """Which profile sections are complete (used for the onboarding review and profile %)."""
    technical = [x for x in s.skills if x.get('c') != 'soft']
    p = s.prefs or {}
    return {
        'personal': bool(s.dob and s.gender and s.location and s.address),
        'education': bool(s.college and s.degree and s.department and s.current_year and s.passing_year
                          and s.p10 and s.p12 and s.score),
        'skills': len(technical) >= 3,
        'projects': s.projects.exists() or s.certs.exists(),
        'resume': bool(s.resume),
        'prefs': bool((p.get('roles') or p.get('cats')) and p.get('locs')),
    }
