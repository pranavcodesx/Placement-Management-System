"""Database tables (see synopsis section 10): Student, Education/Skills (inside Student), Project,
Certification, Company, Job, Application + Notification, Activity, Setting, Token."""
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

DEPARTMENTS = ['Computer Engineering', 'IT', 'Electronics', 'Mechanical', 'Civil']
CATEGORIES = ['IT & Software', 'Data Science', 'Web Development', 'Cloud & DevOps', 'Embedded Systems', 'Core Engineering']
STATUSES = ['Applied', 'In Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected', 'Closed']


class Company(models.Model):
    name = models.CharField(max_length=120, unique=True)
    website = models.URLField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    status = models.CharField(max_length=10, default='Active')
    tagline = models.CharField(max_length=120, blank=True)               # e.g. "Building on belief"
    about = models.TextField(blank=True)                                  # shown on the job details page
    employees = models.CharField(max_length=30, blank=True)               # e.g. "6.1L+"
    countries = models.CharField(max_length=30, blank=True)               # e.g. "100+"
    logo = models.FileField(upload_to='logos/', blank=True)

    def __str__(self):
        return self.name


HIGHLIGHTS = ['Top Hiring', 'Featured', 'Popular']                       # optional badge an admin can put on a job


class Job(models.Model):
    title = models.CharField(max_length=120)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='jobs')
    location = models.CharField(max_length=80)
    job_type = models.CharField(max_length=20, default='Full Time')
    package = models.CharField(max_length=40, default='-')            # e.g. "6 - 12 LPA"
    category = models.CharField(max_length=40, default='IT & Software')
    description = models.TextField(blank=True)
    deadline = models.DateField()
    # eligibility rules
    min_percentage = models.FloatField(default=0)
    min_10th = models.FloatField(default=0)
    min_12th = models.FloatField(default=0)
    max_backlogs = models.PositiveIntegerField(default=0)
    departments = models.JSONField(default=list)
    skills = models.JSONField(default=list)
    start_date = models.DateField(null=True, blank=True)                  # applications open on (blank = when posted)
    interview_date = models.DateField(null=True, blank=True)
    experience = models.CharField(max_length=40, default='Freshers')
    qualification = models.CharField(max_length=80, blank=True)           # e.g. "B.E / B.Tech"
    benefits = models.JSONField(default=list, blank=True)
    highlight = models.CharField(max_length=20, blank=True)               # one of HIGHLIGHTS or blank
    created = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f'{self.title} @ {self.company}'


class SavedJob(models.Model):
    """A job a student bookmarked."""
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='saved_jobs')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='saved_by')
    created = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('student', 'job')


class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student')
    phone = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=10, default='Active')
    photo = models.FileField(upload_to='photos/', blank=True)
    resume = models.FileField(upload_to='resumes/', blank=True)
    resume_name = models.CharField(max_length=200, blank=True)
    resume_date = models.DateField(null=True, blank=True)
    # personal
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=120, blank=True)
    address = models.TextField(blank=True)
    # education
    college = models.CharField(max_length=160, blank=True)
    degree = models.CharField(max_length=60, blank=True)
    department = models.CharField(max_length=60, default='Computer Engineering')
    current_year = models.CharField(max_length=20, blank=True)
    passing_year = models.PositiveIntegerField(null=True, blank=True)
    p10 = models.FloatField(default=0)
    p12 = models.FloatField(default=0)
    score_type = models.CharField(max_length=12, default='CGPA')       # CGPA or Percentage
    score = models.FloatField(default=0)
    percentage = models.FloatField(default=0)                          # derived (CGPA x 9.5)
    backlogs = models.PositiveIntegerField(default=0)
    # skills [{"n": "Python", "c": "lang"}], preferences {"roles":[],"locs":[],"types":[],"sal":0,"cats":[]}
    skills = models.JSONField(default=list, blank=True)
    prefs = models.JSONField(default=dict, blank=True)
    onboarding_step = models.PositiveIntegerField(default=2)
    onboarded = models.BooleanField(default=False)
    created = models.DateTimeField(default=timezone.now)

    @property
    def name(self):
        return self.user.get_full_name() or self.user.username

    @property
    def batch(self):
        return f'{self.passing_year - 4}-{str(self.passing_year)[2:]}' if self.passing_year else ''

    def save(self, *args, **kwargs):
        self.percentage = round(self.score * 9.5, 1) if self.score_type == 'CGPA' else self.score
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Project(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    tech = models.CharField(max_length=200, blank=True)
    link = models.URLField(blank=True, max_length=500)
    demo_link = models.URLField(blank=True, max_length=500)
    status = models.CharField(max_length=10, default='Published')
    thumbnail = models.FileField(upload_to='projects/', blank=True)


class Certification(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='certs')
    name = models.CharField(max_length=160)
    issuer = models.CharField(max_length=120, blank=True)
    year = models.CharField(max_length=10, blank=True)
    issue_date = models.DateField(null=True, blank=True)
    credential_id = models.CharField(max_length=120, blank=True)
    verification_link = models.URLField(blank=True, max_length=500)
    file = models.FileField(upload_to='certificates/files/', blank=True)
    image = models.FileField(upload_to='certificates/', blank=True)


class CareerResource(models.Model):
    RESOURCE_TYPES = ['Guide', 'Course', 'Template', 'Tool', 'Article', 'Study Material', 'Video']
    RESOURCE_STATUSES = ['Published', 'Draft']

    title = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=60, default='Career Guides')
    resource_type = models.CharField(max_length=24, default='Guide')
    tags = models.JSONField(default=list, blank=True)
    file = models.FileField(upload_to='resources/', blank=True)
    external_url = models.URLField(blank=True, max_length=500)
    status = models.CharField(max_length=10, default='Draft')
    downloads = models.PositiveIntegerField(default=0)
    created = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.title


class Application(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='applications')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    status = models.CharField(max_length=12, default='Applied')
    created = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('student', 'job')           # a student can apply to a job only once


class StatusEvent(models.Model):
    """History of real application-stage changes."""
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='events')
    status = models.CharField(max_length=12)
    date = models.DateTimeField(default=timezone.now)


class Interview(models.Model):
    """An interview or campus-drive round scheduled for one application (shown on the student dashboard)."""
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='interviews')
    scheduled = models.DateTimeField()
    round_name = models.CharField(max_length=60, default='Interview')     # e.g. Technical Round, HR Round
    mode = models.CharField(max_length=20, default='On-campus')           # On-campus or Online
    location = models.CharField(max_length=120, blank=True)               # room / meeting link
    created = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['scheduled']

class Notification(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='notifications')
    job = models.ForeignKey('Job', on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    kind = models.CharField(max_length=24, default='general')
    text = models.CharField(max_length=300)
    read = models.BooleanField(default=False)
    created = models.DateTimeField(default=timezone.now)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['student', 'job', 'kind'], name='uniq_student_job_notification_kind'),
        ]


class Activity(models.Model):
    """Admin activity feed / notifications."""
    text = models.CharField(max_length=300)
    read = models.BooleanField(default=False)
    created = models.DateTimeField(default=timezone.now)


class Setting(models.Model):
    """Single-row table for organisation info and the placement policy."""
    org_name = models.CharField(max_length=120, default='CareerTrack')
    phone = models.CharField(max_length=30, default='+91 98765 43210')
    one_offer = models.BooleanField(default=True)         # placed students may only take higher offers
    dream_multiplier = models.FloatField(default=1.5)

    @classmethod
    def get(cls):
        return cls.objects.get_or_create(pk=1)[0]


class Token(models.Model):
    key = models.CharField(max_length=40, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tokens')
    created = models.DateTimeField(default=timezone.now)


class ResetCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created = models.DateTimeField(default=timezone.now)


class ContactMessage(models.Model):
    name = models.CharField(max_length=80)
    email = models.EmailField()
    message = models.TextField()
    created = models.DateTimeField(default=timezone.now)
