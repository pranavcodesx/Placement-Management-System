"""Fill the database with demo data:  python manage.py seed_demo   (add --reset to start fresh)."""
import datetime, random
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from placement.models import (Activity, Application, Certification, Company, Interview, Job, Notification, Project,
                              Setting, Student, StatusEvent)

LANG, FW = {'Python', 'Java', 'C', 'C++', 'JavaScript'}, {'React', 'Django', 'Spring', 'Node.js'}
KIT = {'a': ['HTML', 'CSS', 'JavaScript', 'React', 'Git', 'SQL', 'Python'], 'b': ['Python', 'DSA', 'SQL', 'Django', 'Git', 'Java'],
       'c': ['SQL', 'Python', 'Excel', 'Power BI'], 'd': ['Java', 'SQL', 'Spring', 'Git', 'DSA'], 'e': ['C', 'Embedded', 'Python', 'Linux'],
       'f': ['AutoCAD', 'SolidWorks', 'Excel'], 'g': ['AutoCAD', 'STAAD', 'Excel'], 'h': ['JavaScript', 'Node.js', 'SQL', 'Git']}
COMPANIES = [('TCS', 'tcs', '+91 91234 56701'), ('Infosys', 'infosys', '+91 91234 56702'), ('Google', 'google', '+91 91234 56703'),
             ('Microsoft', 'microsoft', '+91 91234 56704'), ('Amazon', 'amazon', '+91 91234 56705'), ('Wipro', 'wipro', '+91 91234 56706'),
             ('L&T', 'larsentoubro', '+91 91234 56707'), ('Accenture', 'accenture', '+91 91234 56708')]
CI, CIE = ['Computer Engineering', 'IT'], ['Computer Engineering', 'IT', 'Electronics']
# title, company#, city, min%, package, skills, days to deadline, departments, max backlogs, 10th, 12th, category
JOBS = [('Frontend Developer', 4, 'Pune', 60, '6 - 12 LPA', ['HTML', 'CSS', 'JavaScript', 'React'], 19, CI, 0, 0, 0, 'Web Development'),
        ('Software Engineer', 3, 'Hyderabad', 70, '4 - 8 LPA', ['Python', 'DSA', 'SQL'], 23, CIE, 0, 0, 0, 'IT & Software'),
        ('System Engineer', 1, 'Pune', 55, '3 - 6 LPA', ['Java', 'SQL'], 13, CIE, 1, 60, 60, 'IT & Software'),
        ('Data Analyst', 2, 'Bangalore', 60, '4 - 7 LPA', ['SQL', 'Python', 'Excel'], 21, CI, 0, 55, 55, 'Data Science'),
        ('Backend Developer', 4, 'Pune', 65, '6 - 12 LPA', ['Python', 'Django', 'SQL'], 28, CI, 0, 0, 0, 'IT & Software'),
        ('DevOps Engineer', 5, 'Bangalore', 75, '8 - 14 LPA', ['Linux', 'Docker', 'Git'], 33, CI, 0, 0, 0, 'Cloud & DevOps'),
        ('Embedded Engineer', 6, 'Chennai', 60, '3.5 - 6 LPA', ['C', 'Embedded', 'Linux'], 16, ['Electronics'], 1, 60, 60, 'Embedded Systems'),
        ('Design Engineer', 7, 'Mumbai', 60, '4 - 6 LPA', ['AutoCAD', 'SolidWorks', 'Excel'], 9, ['Mechanical', 'Civil'], 1, 0, 0, 'Core Engineering'),
        ('Associate Software Engineer', 8, 'Pune', 55, '4.5 - 6.5 LPA', ['Java', 'SQL', 'JavaScript'], 6, CIE, 1, 60, 60, 'IT & Software')]
# name, email, department, score type, score, backlogs, skill kit, 12th %, city
STUDENTS = [('Swara Narkar', 'swara@example.com', 'Computer Engineering', 'CGPA', 8.2, 0, 'a', 88.2, 'Pune'),
            ('Rahul Sharma', 'rahul@college.com', 'Computer Engineering', 'Percentage', 82, 0, 'b', 84, 'Pune'),
            ('Priya Patel', 'priya@college.com', 'IT', 'Percentage', 74, 0, 'c', 79, 'Mumbai'),
            ('Amit Kumar', 'amit@college.com', 'Mechanical', 'Percentage', 68, 1, 'f', 72, 'Nashik'),
            ('Sneha Desai', 'sneha@college.com', 'Civil', 'Percentage', 71, 0, 'g', 77, 'Kolhapur'),
            ('Rohan Verma', 'rohan@college.com', 'Computer Engineering', 'Percentage', 66, 2, 'd', 58, 'Pune'),
            ('Anjali Joshi', 'anjali@college.com', 'IT', 'CGPA', 8.6, 0, 'h', 90, 'Pune'),
            ('Karan Mehta', 'karan@college.com', 'Electronics', 'Percentage', 69, 1, 'e', 70, 'Mumbai'),
            ('Neha Kulkarni', 'neha@college.com', 'Computer Engineering', 'CGPA', 9.2, 0, 'b', 93, 'Pune'),
            ('Vikas Patil', 'vikas@college.com', 'Mechanical', 'Percentage', 63, 0, 'f', 66, 'Satara'),
            ('Isha Deshmukh', 'isha@college.com', 'Electronics', 'Percentage', 77, 0, 'e', 81, 'Pune'),
            ('Siddharth Rao', 'sid@college.com', 'IT', 'Percentage', 72, 0, 'c', 75, 'Bangalore')]


def skill(n, soft=False):
    return {'n': n, 'c': 'soft' if soft else 'lang' if n in LANG else 'fw' if n in FW else 'tech'}


# Demo values for the new company / job detail fields (an admin can edit all of these from the admin panel).
COMPANY_INFO = {
    'TCS': ('Building on belief', 'A global IT services, consulting and business solutions company that helps organisations transform with technology.', '6L+', '50+'),
    'Infosys': ('Navigate your next', 'A global leader in next-generation digital services and consulting, working with clients in more than fifty countries.', '3L+', '50+'),
    'Google': ('Organising the world’s information', 'Google builds products used by billions of people, from Search and Maps to Cloud and Android.', '1.8L+', '50+'),
    'Microsoft': ('Empowering every person and organisation', 'Microsoft builds software, cloud services and devices that help people and businesses do more.', '2L+', '100+'),
    'Amazon': ('Work hard. Have fun. Make history.', 'Amazon is one of the world’s largest e-commerce and cloud computing companies.', '15L+', '100+'),
    'Wipro': ('Spirit of Wipro', 'A leading technology services and consulting company focused on building innovative solutions for clients.', '2L+', '60+'),
    'L&T': ('It’s all about Imagineering', 'Larsen & Toubro is a technology, engineering, construction and manufacturing conglomerate.', '4L+', '50+'),
    'Accenture': ('Let there be change', 'Accenture is a global professional services company with leading capabilities in digital, cloud and security.', '7L+', '120+'),
}
BENEFITS = ['Health insurance', 'Paid training and certifications', 'Flexible work hours', 'Relocation support', 'Performance bonus', 'Mentorship programme']
HIGHLIGHT_BY_TITLE = {'Frontend Developer': 'Top Hiring', 'Software Engineer': 'Featured', 'Backend Developer': 'Popular'}


def job_points(title, category):
    return '\n'.join([f'Work on {category} projects in the {title} role, from design to delivery.',
                      'Collaborate with cross-functional teams to deliver scalable, reliable work.',
                      'Follow best practices for quality, security and performance.',
                      'Learn from mentors and stay updated with the latest industry trends.'])


def enrich_demo(out):
    """Fill the new detail fields for demo companies and jobs (only where they are still empty), so the pages look complete."""
    n = 0
    for c in Company.objects.all():
        info = COMPANY_INFO.get(c.name)
        if info and not c.about:
            c.tagline, c.about, c.employees, c.countries = info; c.save(); n += 1
    for i, j in enumerate(Job.objects.select_related('company').order_by('id')):
        if j.benefits or j.company.name not in COMPANY_INFO:
            continue
        j.benefits = BENEFITS[i % 3: i % 3 + 4]
        j.qualification = 'B.E / B.Tech'
        j.experience = '0 - 1 Year' if i % 2 == 0 else 'Freshers'
        j.highlight = HIGHLIGHT_BY_TITLE.get(j.title, '')
        j.start_date = timezone.localtime(j.created).date()
        j.interview_date = j.deadline + datetime.timedelta(days=10) if i % 2 == 0 else None
        if 'You will work with experienced engineers' in j.description:
            j.description = job_points(j.title, j.category)
        j.save(); n += 1
    if n: out.write(f'Added detail fields to {n} demo companies/jobs')


def add_demo_interviews(out):
    """Give the demo student two upcoming interviews (only once) so the dashboard has something to show."""
    s = Student.objects.filter(user__username='swara@example.com').first()
    if not s or Interview.objects.filter(application__student=s).exists():
        return
    a = s.applications.filter(status='Shortlisted').order_by('-created').first()
    if not a:
        return
    base = timezone.localtime().replace(hour=10, minute=0, second=0, microsecond=0)
    Interview.objects.create(application=a, round_name='Technical Round', mode='On-campus', location='Placement Cell, Room 204',
                             scheduled=base + datetime.timedelta(days=4))
    Interview.objects.create(application=a, round_name='HR Round', mode='Online', location='Google Meet (link sent by email)',
                             scheduled=base + datetime.timedelta(days=9, hours=1, minutes=30))
    out.write('Added 2 demo interviews for swara@example.com')


class Command(BaseCommand):
    help = 'Create demo companies, jobs, students, applications and the admin account'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true')

    def handle(self, *args, **o):
        if o['reset']:
            for m in (Application, Job, Company, Notification, Activity):
                m.objects.all().delete()
            User.objects.all().delete()
        if User.objects.filter(is_staff=True).exists():
            demo_user = User.objects.filter(username='pranav@example.com', is_staff=False).first()
            if demo_user:
                if User.objects.filter(username='swara@example.com').exclude(pk=demo_user.pk).exists():
                    raise CommandError('Cannot rename the demo student: swara@example.com is already in use.')
                demo_user.username = demo_user.email = 'swara@example.com'
                demo_user.first_name = 'Swara Narkar'
                demo_user.save(update_fields=['username', 'email', 'first_name'])
                demo_user.student.gender = 'Female'
                demo_user.student.save(update_fields=['gender'])
                self.stdout.write('Updated demo student: swara@example.com / student123')
                add_demo_interviews(self.stdout)
                enrich_demo(self.stdout)
                return
            add_demo_interviews(self.stdout)
            enrich_demo(self.stdout)
            return self.stdout.write('Data already exists. Use --reset to recreate it.')
        rnd, now = random.Random(11), timezone.now()
        User.objects.create_user('admin@careertrack.com', 'admin@careertrack.com', 'admin123', first_name='Admin User', is_staff=True, is_superuser=True)
        Setting.get()
        cos = [Company.objects.create(name=n, website=f'https://www.{d}.com', phone=p) for n, d, p in COMPANIES]
        jobs = [Job.objects.create(title=t, company=cos[c - 1], location=l, min_percentage=m, package=pk, skills=sk,
                                   deadline=timezone.localdate() + datetime.timedelta(days=dd), departments=dp, max_backlogs=mb,
                                   min_10th=a, min_12th=b, category=cat,
                                   description=f'We are hiring a {t} to build and ship real products. You will work with experienced engineers, learn on the job and own your work from day one.')
                for t, c, l, m, pk, sk, dd, dp, mb, a, b, cat in JOBS]
        studs = []
        for i, (n, e, d, sty, sc, bk, kit, p12, city) in enumerate(STUDENTS):
            u = User.objects.create_user(e, e, 'student123', first_name=n)
            s = Student.objects.create(
                user=u, phone=f'+91 9{8765 + i:04d} {43210 + i * 111}', department=d, score_type=sty, score=sc, backlogs=bk, p12=p12,
                p10=round(rnd.uniform(70, 93), 1), dob=datetime.date(2003, 1 + i % 12, 10 + i), gender='Male' if i % 3 else 'Female',
                location=city, address=f'{10 + i}, Main Road, {city}', college='Sample Institute of Technology', degree='B.E.',
                current_year='4th Year', passing_year=2026, onboarded=True, onboarding_step=9,
                skills=[skill(k) for k in KIT[kit]] + [skill('Communication', True), skill('Teamwork', True)],
                prefs={'roles': ['Software Developer'], 'locs': [city, 'Pune'], 'types': ['Full-Time'], 'sal': 4, 'cats': ['IT & Software']},
                resume_name=f'{n.replace(" ", "_")}_Resume.pdf', resume_date=timezone.localdate() - datetime.timedelta(days=20))
            s.resume.name = f'resumes/demo_{s.pk}.pdf'
            s.save()
            studs.append(s)
        p = studs[0]
        Project.objects.create(student=p, name='E-Commerce Website', description='A full-stack e-commerce platform', tech='React, Node.js, MongoDB', link='https://github.com/swara/shop')
        Certification.objects.create(student=p, name='Full Stack Development', issuer='Coursera', year='2025')
        got = {2}

        def add(si, ji, status, ago):
            s, j = studs[si - 1], jobs[ji - 1]
            if Application.objects.filter(student=s, job=j).exists():
                return
            t0 = now - datetime.timedelta(days=ago)
            a = Application.objects.create(student=s, job=j, status=status, created=t0)
            StatusEvent.objects.create(application=a, status='Applied', date=t0)
            if status in ('Shortlisted', 'Selected'):
                StatusEvent.objects.create(application=a, status='Shortlisted', date=t0 + datetime.timedelta(days=3))
            if status == 'Selected':
                StatusEvent.objects.create(application=a, status='Selected', date=t0 + datetime.timedelta(days=8))
            if status == 'Rejected':
                StatusEvent.objects.create(application=a, status='Rejected', date=t0 + datetime.timedelta(days=5))
        add(1, 1, 'Applied', 3); add(1, 4, 'Shortlisted', 14); add(2, 2, 'Selected', 40)
        for _ in range(90):
            si, ji, r = 2 + rnd.randrange(11), 1 + rnd.randrange(9), rnd.randrange(10)
            status = 'Applied' if r < 4 else 'Shortlisted' if r < 6 else 'Rejected' if r < 8 else 'Selected'
            if studs[si - 1].department not in jobs[ji - 1].departments:
                continue
            if status == 'Selected':
                if si in got:
                    continue
                got.add(si)
            add(si, ji, status, 1 + rnd.randrange(20) if status == 'Applied' else 12 + rnd.randrange(140))
        for text, h in (('Your application for Data Analyst has been shortlisted', 2), ('New job opportunity: Backend Developer at Microsoft', 26),
                        ('Welcome to CareerTrack! Complete your profile to see jobs you are eligible for.', 50)):
            Notification.objects.create(student=p, text=text, created=now - datetime.timedelta(hours=h), read=h > 40)
        for text, h in (('New application from Swara Narkar for Frontend Developer', .05), ('Company Accenture added a job', 3),
                        ('Status updated for Priya Patel', 5), ('New student registered: Siddharth Rao', 30)):
            Activity.objects.create(text=text, created=now - datetime.timedelta(hours=h))
        add_demo_interviews(self.stdout)
        enrich_demo(self.stdout)
        self.stdout.write(self.style.SUCCESS(f'Demo data ready: {len(studs)} students, {len(jobs)} jobs, {Application.objects.count()} applications.'))
        self.stdout.write('Admin: admin@careertrack.com / admin123      Student: swara@example.com / student123')
