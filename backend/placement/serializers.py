"""Turn database rows into the compact JSON the front-end uses."""
from django.utils import timezone
from .logic import sections


def s_resource(resource):
    return {
        'id': resource.id, 't': resource.title, 'ds': resource.description, 'cat': resource.category,
        'ty': resource.resource_type, 'tags': resource.tags,
        'file': resource.file.url if resource.file else '',
        'fn': resource.file.name.rsplit('/', 1)[-1] if resource.file else '',
        'url': resource.external_url, 'st': resource.status, 'dl': resource.downloads,
        'up': timezone.localtime(resource.created).date().isoformat(),
    }


def ms(dt):
    return int(dt.timestamp() * 1000)


def day(dt):
    return timezone.localtime(dt).date().isoformat()


def s_company(c):
    return {'id': c.id, 'n': c.name, 'w': c.website, 'p': c.phone, 's': c.status, 'tg': c.tagline, 'ab': c.about,
            'em': c.employees, 'ct': c.countries, 'lg': c.logo.url if c.logo else ''}


def s_job(j):
    return {'id': j.id, 't': j.title, 'c': j.company_id, 'l': j.location, 'ty': j.job_type, 'pk': j.package,
            'cat': j.category, 'ds': j.description, 'dl': j.deadline.isoformat(), 'min': j.min_percentage,
            'm10': j.min_10th, 'm12': j.min_12th, 'mb': j.max_backlogs, 'd': j.departments, 'sk': j.skills,
            'sd': (j.start_date or timezone.localtime(j.created).date()).isoformat(),
            'ivd': j.interview_date.isoformat() if j.interview_date else '', 'ex': j.experience, 'ql': j.qualification,
            'bn': j.benefits, 'hl': j.highlight, 'cr': timezone.localtime(j.created).date().isoformat()}


def s_app(a):
    return {'id': a.id, 's': a.student_id, 'j': a.job_id, 'st': a.status, 'dt': day(a.created),
            'h': [{'st': e.status, 'dt': day(e.date)} for e in a.events.order_by('date', 'id')]}


def s_student(s):
    sec = sections(s)
    return {
        'id': s.id, 'n': s.name, 'e': s.user.email, 'ph': s.phone, 's': s.status,
        'photo': s.photo.url if s.photo else '', 'dob': s.dob.isoformat() if s.dob else '', 'gn': s.gender,
        'loc': s.location, 'ad': s.address, 'col': s.college, 'deg': s.degree, 'd': s.department,
        'yr': s.current_year, 'py': s.passing_year or '', 'p10': s.p10, 'p12': s.p12, 'sty': s.score_type,
        'sc': s.score, 'pct': s.percentage, 'bk': s.backlogs, 'b': s.batch,
        'skills': s.skills, 'sk': [x['n'] for x in s.skills],
        'pr': [{'id': p.id, 'n': p.name, 'ds': p.description, 'tk': p.tech, 'lk': p.link, 'demo': p.demo_link,
                'st': p.status, 'thumb': p.thumbnail.url if p.thumbnail else ''} for p in s.projects.all()],
        'ce': [{'id': c.id, 'n': c.name, 'o': c.issuer, 'y': c.year,
                'idat': c.issue_date.isoformat() if c.issue_date else '',
                'cid': c.credential_id, 'vl': c.verification_link,
                'file': c.file.url if c.file else '', 'fn': c.file.name.rsplit('/', 1)[-1] if c.file else '',
                'img': c.image.url if c.image else ''} for c in s.certs.all()],
        'rs': s.resume_name if s.resume else '', 'rsu': s.resume.url if s.resume else '',
        'rsd': s.resume_date.isoformat() if s.resume_date else '',
        'pref': {'roles': [], 'locs': [], 'types': [], 'sal': 0, 'cats': [], **(s.prefs or {})},
        'jn': timezone.localtime(s.created).date().isoformat(), 'step': s.onboarding_step, 'ob': s.onboarded, 'sec': sec, 'pp': round(sum(sec.values()) / len(sec) * 100),
    }


def s_notes(qs):
    return [{'id': n.id, 't': getattr(n, 'text'), 'tm': ms(n.created), 'rd': int(n.read)} for n in qs]


def s_interview(i):
    return {'id': i.id, 'a': i.application_id, 'at': ms(i.scheduled), 'r': i.round_name, 'md': i.mode, 'lc': i.location}
