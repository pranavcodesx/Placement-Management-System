"""JSON API. Every endpoint returns JSON; errors look like {"error": "message"}."""
import csv, json, re, secrets, random, datetime
from functools import wraps

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Count, F
from django.http import JsonResponse
from django.http.multipartparser import MultiPartParser, MultiPartParserError
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.views.decorators.csrf import csrf_exempt

from . import logic, serializers as ser
from .models import (Activity, Application, CareerResource, Certification, Company, ContactMessage, DEPARTMENTS, CATEGORIES, HIGHLIGHTS, Interview,
                     Job, Notification, SavedJob, Project, ResetCode, Setting, Student, StatusEvent, Token, STATUSES)

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


class ApiError(Exception):
    def __init__(self, msg, status=400):
        self.msg, self.status = msg, status


def api(role=None):
    """Decorator: parses JSON, checks the Bearer token and the role ('student' / 'admin')."""
    def deco(fn):
        @csrf_exempt
        @wraps(fn)
        def wrapper(request, *a, **k):
            try:
                request.data = {}
                if 'json' in (request.content_type or '') and request.body:
                    try:
                        request.data = json.loads(request.body)
                    except ValueError:
                        raise ApiError('Invalid JSON')
                if role:
                    authenticate_request(request, role)
                return fn(request, *a, **k)
            except ApiError as e:
                return JsonResponse({'error': e.msg}, status=e.status)
        return wrapper
    return deco


def authenticate_request(request, role):
    header = request.headers.get('Authorization', '')
    token = Token.objects.select_related('user').filter(key=header[7:]).first() if header.startswith('Bearer ') else None
    if not token or timezone.now() - token.created > datetime.timedelta(days=7):
        raise ApiError('Please log in again.', 401)
    u = token.user
    if role == 'admin':
        if not (u.is_staff and u.is_active):
            raise ApiError('Admin access only.', 403)
        request.admin = u
    else:
        s = Student.objects.filter(user=u).first()
        if u.is_staff or not s or not u.is_active:
            raise ApiError('Student access only.', 403)
        if s.status != 'Active':
            raise ApiError('This account is inactive. Contact the placement cell.', 403)
        request.me = s
    request.token = token


def need(request, *methods):
    if request.method not in methods:
        raise ApiError('Method not allowed', 405)


def text(v, n=200):
    return str(v or '').strip()[:n]


def num(v, lo, hi, label):
    try:
        v = float(v)
    except (TypeError, ValueError):
        raise ApiError(f'{label} must be a number')
    if not lo <= v <= hi:
        raise ApiError(f'{label} must be between {lo:g} and {hi:g}')
    return v


def date(v, label):
    try:
        return datetime.date.fromisoformat(str(v))
    except ValueError:
        raise ApiError(f'{label} is not a valid date')


def opt_date(v, label):
    return date(v, label) if text(v) else None


def check_password(pw):
    if len(pw or '') < 8 or not re.search(r'[A-Za-z]', pw) or not re.search(r'\d', pw):
        raise ApiError('Password must be at least 8 characters with a letter and a number.')


def new_token(user):
    return Token.objects.create(key=secrets.token_hex(20), user=user).key


def phone10(v):
    d = re.sub(r'\D', '', str(v or ''))[-10:]
    if not re.fullmatch(r'[6-9]\d{9}', d):
        raise ApiError('Enter a valid 10 digit mobile number.')
    return f'+91 {d[:5]} {d[5:]}'


# ---------------------------------------------------------------- auth
@api()
def register(request):
    need(request, 'POST')
    d = request.data
    name, email = text(d.get('name'), 80), text(d.get('email')).lower()
    if len(name) < 2: raise ApiError('Enter your full name.')
    if not EMAIL_RE.match(email): raise ApiError('Enter a valid email address.')
    phone = phone10(d.get('phone'))
    check_password(d.get('password'))
    if User.objects.filter(username=email).exists():
        raise ApiError('An account with this email already exists.', 409)
    u = User.objects.create_user(username=email, email=email, password=d['password'], first_name=name)
    s = Student.objects.create(user=u, phone=phone)
    logic.notify(s, 'Welcome to CareerTrack! Complete your profile to see jobs you are eligible for.')
    logic.log(f'New student registered: {name}')
    return JsonResponse({'token': new_token(u), 'role': 'student', 'onboarded': False})


@api()
def login(request):
    need(request, 'POST')
    d = request.data
    email, role = text(d.get('email')).lower(), d.get('role', 'student')
    key = 'fail:' + email
    if cache.get(key, 0) >= 5:
        raise ApiError('Too many attempts. Try again in 30 seconds.', 429)
    u = authenticate(username=email, password=d.get('password', ''))
    good = u and u.is_active and ((role == 'admin' and u.is_staff) or (role == 'student' and not u.is_staff and hasattr(u, 'student')))
    if not good:
        cache.set(key, cache.get(key, 0) + 1, 30)
        raise ApiError('Wrong email or password.', 401)
    if role == 'student' and u.student.status != 'Active':
        raise ApiError('This account is inactive. Contact the placement cell.', 403)
    cache.delete(key)
    return JsonResponse({'token': new_token(u), 'role': role, 'onboarded': u.student.onboarded if role == 'student' else True})


@api()
def logout(request):
    Token.objects.filter(key=request.headers.get('Authorization', '')[7:]).delete()
    return JsonResponse({'ok': True})


@api()
def forgot(request):
    need(request, 'POST')
    email = text(request.data.get('email')).lower()
    u = User.objects.filter(username=email, is_staff=False).first()
    out = {'sent': True}
    if u:
        code = f'{random.randint(0, 999999):06d}'
        ResetCode.objects.filter(user=u).delete()
        ResetCode.objects.create(user=u, code=code)
        send_mail('CareerTrack password reset', f'Your reset code is {code}. It is valid for 15 minutes.', 'noreply@careertrack.local', [email])
        if settings.DEBUG:
            out['dev_code'] = code               # shown on screen only in development
    return JsonResponse(out)


@api()
def reset(request):
    need(request, 'POST')
    d = request.data
    u = User.objects.filter(username=text(d.get('email')).lower(), is_staff=False).first()
    rc = ResetCode.objects.filter(user=u, code=text(d.get('code'), 6)).first() if u else None
    if not rc or timezone.now() - rc.created > datetime.timedelta(minutes=15):
        raise ApiError('Invalid or expired code.')
    check_password(d.get('password'))
    u.set_password(d['password']); u.save()
    rc.delete(); u.tokens.all().delete()
    return JsonResponse({'ok': True})


# ---------------------------------------------------------------- public (landing site)
@api()
def overview(request):
    today = timezone.localdate()
    sel = list(Application.objects.filter(status='Selected').select_related('job'))
    total = Student.objects.count()
    placed = len({a.student_id for a in sel})
    pk = [logic.pk_max(a.job.package) for a in sel]
    return JsonResponse({
        'jobs': [ser.s_job(j) for j in Job.objects.filter(deadline__gte=today).order_by('-id')],
        'cos': [ser.s_company(c) for c in Company.objects.filter(status='Active')],
        'stats': {'jobs': Job.objects.filter(deadline__gte=today).count(), 'cos': Company.objects.count(),
                  'students': total, 'offers': len(sel), 'placed': placed,
                  'rate': round(placed / total * 100) if total else 0,
                  'hi': max(pk, default=0), 'avg': round(sum(pk) / len(pk), 1) if pk else 0}})


@api()
def contact(request):
    need(request, 'POST')
    d = request.data
    name, email, msg = text(d.get('name'), 80), text(d.get('email')), text(d.get('message'), 2000)
    if not name or not EMAIL_RE.match(email) or not msg:
        raise ApiError('Please fill in your name, a valid email and a message.')
    ContactMessage.objects.create(name=name, email=email, message=msg)
    logic.log(f'Contact message from {name} ({email})')
    return JsonResponse({'ok': True})


# ---------------------------------------------------------------- student
def student_payload(s):
    return {
        'me': ser.s_student(s),
        'jobs': [ser.s_job(j) for j in Job.objects.all()],
        'cos': [ser.s_company(c) for c in Company.objects.all()],
        'apps': [ser.s_app(a) for a in s.applications.prefetch_related('events')],
        'nt': ser.s_notes(s.notifications.all()),
        'iv': [ser.s_interview(i) for i in Interview.objects.filter(application__student=s).order_by('scheduled')],
        'sv': list(s.saved_jobs.values_list('job_id', flat=True)),
        'pl': Student.objects.filter(applications__status='Selected').distinct().count(),
        'pol': {'one': int(Setting.get().one_offer), 'dream': Setting.get().dream_multiplier},
        'resources': [ser.s_resource(r) for r in CareerResource.objects.filter(status='Published').order_by('-created')],
    }


@api('student')
def s_boot(request):
    return JsonResponse(student_payload(request.me))


@api('student')
def s_skill_gap(request):
    need(request, 'GET')
    jobs = Job.objects.filter(deadline__gte=timezone.localdate()).order_by('id')
    return JsonResponse({'skills': logic.skill_gap(request.me, jobs)})


@transaction.atomic
def save_profile(s, d):
    """Validate and save any subset of the profile. Used by the onboarding wizard and the profile pages."""
    u = s.user
    if 'name' in d:
        n = text(d['name'], 80)
        if len(n) < 2: raise ApiError('Enter your full name.')
        u.first_name = n; u.save()
    if 'phone' in d: s.phone = phone10(d['phone'])
    if 'dob' in d:
        dob = date(d['dob'], 'Date of birth')
        age = (timezone.localdate() - dob).days / 365.25
        if not 16 <= age <= 45: raise ApiError('Date of birth looks wrong. Age must be between 16 and 45.')
        s.dob = dob
    if 'gender' in d:
        if d['gender'] not in ('Male', 'Female', 'Other', 'Prefer not to say'): raise ApiError('Select a gender.')
        s.gender = d['gender']
    if 'loc' in d: s.location = text(d['loc'], 120)
    if 'ad' in d: s.address = text(d['ad'], 400)
    for key, attr in (('col', 'college'), ('deg', 'degree'), ('yr', 'current_year')):
        if key in d: setattr(s, attr, text(d[key], 160))
    if 'd' in d:
        if d['d'] not in DEPARTMENTS: raise ApiError('Select a valid department.')
        s.department = d['d']
    if 'py' in d: s.passing_year = int(num(d['py'], 2000, 2100, 'Passing year'))
    if 'p10' in d: s.p10 = num(d['p10'], 0, 100, '10th percentage')
    if 'p12' in d: s.p12 = num(d['p12'], 0, 100, '12th / diploma percentage')
    if 'sty' in d or 'sc' in d:
        sty = d.get('sty', s.score_type)
        if sty not in ('CGPA', 'Percentage'): raise ApiError('Select CGPA or Percentage.')
        s.score_type = sty
        s.score = num(d.get('sc', s.score), 0, 10 if sty == 'CGPA' else 100, 'Graduation ' + sty)
    if 'bk' in d: s.backlogs = int(num(d['bk'], 0, 30, 'Backlogs'))
    if 'skills' in d:
        seen, out = set(), []
        for x in d['skills'][:80]:
            n, c = text(x.get('n'), 40), x.get('c')
            if n and n.lower() not in seen and c in ('tech', 'lang', 'fw', 'soft'):
                seen.add(n.lower()); out.append({'n': n, 'c': c})
        s.skills = out
    if 'pref' in d:
        p = d['pref']
        s.prefs = {'roles': [text(x, 60) for x in p.get('roles', [])][:8], 'locs': [text(x, 60) for x in p.get('locs', [])][:8],
                   'types': [x for x in p.get('types', []) if x in ('Full-Time', 'Internship')],
                   'sal': num(p.get('sal') or 0, 0, 200, 'Expected salary'),
                   'cats': [x for x in p.get('cats', []) if x in CATEGORIES]}
    if 'pr' in d:
        existing = {str(p.pk): p for p in s.projects.all()}
        for p in d['pr'][:20]:
            if text(p.get('n')):
                project_id = str(p.get('id', ''))
                project = existing.pop(project_id, None) if project_id else None
                if project_id and not project:
                    raise ApiError('Project not found.')
                link = text(p.get('lk'), 500)
                if link and not link.startswith(('http://', 'https://')): raise ApiError('Project link must start with http:// or https://')
                demo = text(p.get('demo'), 500)
                if demo and not demo.startswith(('http://', 'https://')): raise ApiError('Live demo link must start with http:// or https://')
                status = p.get('st', project.status if project else 'Published')
                if status not in ('Published', 'Draft'): raise ApiError('Select Published or Draft for project status.')
                if project is None: project = Project(student=s)
                project.name, project.description, project.tech = text(p['n'], 120), text(p.get('ds'), 600), text(p.get('tk'), 200)
                project.link, project.demo_link, project.status = link, demo, status
                project.save()
        for project in existing.values():
            if project.thumbnail:
                file_name, storage = project.thumbnail.name, project.thumbnail.storage
                transaction.on_commit(lambda name=file_name, store=storage: store.delete(name))
            project.delete()
    if 'ce' in d:
        existing = {str(c.pk): c for c in s.certs.all()}
        for c in d['ce'][:20]:
            if text(c.get('n')):
                cert_id = str(c.get('id', ''))
                cert = existing.pop(cert_id, None) if cert_id else None
                if cert_id and not cert:
                    raise ApiError('Certification not found.')
                if cert is None:
                    cert = Certification(student=s)
                verification_link = text(c.get('vl'), 500)
                if verification_link and not verification_link.startswith(('http://', 'https://')):
                    raise ApiError('Verification link must start with http:// or https://')
                cert.name, cert.issuer = text(c['n'], 160), text(c.get('o'), 120)
                if 'idat' in c:
                    cert.issue_date = date(c['idat'], 'Issue date') if c['idat'] else None
                    cert.year = str(cert.issue_date.year) if cert.issue_date else text(c.get('y'), 10)
                else:
                    cert.year = text(c.get('y'), 10)
                cert.credential_id, cert.verification_link = text(c.get('cid'), 120), verification_link
                cert.save()
        for cert in existing.values():
            for field in (cert.image, cert.file):
                if field:
                    file_name, storage = field.name, field.storage
                    transaction.on_commit(lambda name=file_name, store=storage: store.delete(name))
            cert.delete()
    if 'step' in d: s.onboarding_step = int(num(d['step'], 2, 9, 'Step'))
    if d.get('finish'):
        sec = logic.sections(s)
        if not (sec['personal'] and sec['education'] and sec['skills']):
            raise ApiError('Complete the personal, education and skills steps first.')
        s.onboarded = True
    s.save()


@api('student')
def s_profile(request):
    need(request, 'PUT')
    save_profile(request.me, request.data)
    return JsonResponse({'me': ser.s_student(request.me)})


def upload(request, kinds, max_mb, label):
    f = request.FILES.get('file')
    if not f: raise ApiError('Choose a file first.')
    ext = f.name.rsplit('.', 1)[-1].lower() if '.' in f.name else ''
    if ext not in kinds: raise ApiError(f'{label} must be {", ".join(k.upper() for k in kinds)}.')
    if f.size > max_mb * 1024 * 1024: raise ApiError(f'{label} must be under {max_mb} MB.')
    return f, ext


@api('student')
def s_saved(request):
    """Bookmark (on=true) or un-bookmark a job."""
    need(request, 'POST')
    j = Job.objects.filter(pk=request.data.get('job')).first()
    if not j: raise ApiError('Job not found.', 404)
    if request.data.get('on'): SavedJob.objects.get_or_create(student=request.me, job=j)
    else: SavedJob.objects.filter(student=request.me, job=j).delete()
    return JsonResponse({'ok': True})


@api('student')
def s_photo(request):
    s = request.me
    if request.method == 'DELETE':
        s.photo.delete(save=False); s.photo = ''; s.save()
    else:
        need(request, 'POST')
        f, ext = upload(request, ('jpg', 'jpeg', 'png', 'webp'), 2, 'Photo')
        s.photo.delete(save=False)
        s.photo.save(f'{s.pk}.{ext}', f, save=True)
    return JsonResponse({'me': ser.s_student(s)})


@api('student')
def s_resume(request):
    s = request.me
    if request.method == 'DELETE':
        s.resume.delete(save=False); s.resume = ''; s.resume_name = ''; s.resume_date = None; s.save()
    else:
        need(request, 'POST')
        f, ext = upload(request, ('pdf', 'doc', 'docx'), 5, 'Resume')
        s.resume.delete(save=False)
        s.resume_name, s.resume_date = f.name[:200], timezone.localdate()
        s.resume.save(f'{s.pk}.{ext}', f, save=True)
    return JsonResponse({'me': ser.s_student(s)})


@api('student')
def s_cert_image(request, pk):
    need(request, 'POST', 'DELETE')
    cert = request.me.certs.filter(pk=pk).first()
    if not cert:
        raise ApiError('Certification not found.', 404)
    if request.method == 'DELETE':
        if cert.image:
            image_name, storage = cert.image.name, cert.image.storage
            cert.image = ''
            cert.save(update_fields=['image'])
            transaction.on_commit(lambda: storage.delete(image_name))
    else:
        f, ext = upload(request, ('jpg', 'jpeg', 'png', 'webp'), 3, 'Certificate image')
        signature = f.read(12)
        f.seek(0)
        valid = (ext in ('jpg', 'jpeg') and signature.startswith(b'\xff\xd8\xff')) or \
                (ext == 'png' and signature.startswith(b'\x89PNG\r\n\x1a\n')) or \
                (ext == 'webp' and signature[:4] == b'RIFF' and signature[8:12] == b'WEBP')
        if not valid:
            raise ApiError('Choose a valid JPG, PNG or WEBP image.')
        old_image = cert.image.name if cert.image else ''
        storage = cert.image.storage
        cert.image.save(f'{cert.pk}.{ext}', f, save=True)
        if old_image:
            transaction.on_commit(lambda: storage.delete(old_image))
    return JsonResponse({'me': ser.s_student(request.me)})


def valid_image(f, ext):
    signature = f.read(12)
    f.seek(0)
    return (ext in ('jpg', 'jpeg') and signature.startswith(b'\xff\xd8\xff')) or \
        (ext == 'png' and signature.startswith(b'\x89PNG\r\n\x1a\n')) or \
        (ext == 'webp' and signature[:4] == b'RIFF' and signature[8:12] == b'WEBP')


@api('student')
def s_project_thumbnail(request, pk):
    need(request, 'POST', 'DELETE')
    project = request.me.projects.filter(pk=pk).first()
    if not project:
        raise ApiError('Project not found.', 404)
    if request.method == 'DELETE':
        if project.thumbnail:
            file_name, storage = project.thumbnail.name, project.thumbnail.storage
            project.thumbnail = ''
            project.save(update_fields=['thumbnail'])
            transaction.on_commit(lambda: storage.delete(file_name))
    else:
        f, ext = upload(request, ('jpg', 'jpeg', 'png'), 5, 'Project thumbnail')
        if not valid_image(f, ext):
            raise ApiError('Choose a valid JPG or PNG image.')
        old_file = project.thumbnail.name if project.thumbnail else ''
        storage = project.thumbnail.storage
        project.thumbnail.save(f'{project.pk}.{ext}', f, save=True)
        if old_file:
            transaction.on_commit(lambda: storage.delete(old_file))
    return JsonResponse({'me': ser.s_student(request.me)})


@api('student')
def s_cert_file(request, pk):
    need(request, 'POST', 'DELETE')
    cert = request.me.certs.filter(pk=pk).first()
    if not cert:
        raise ApiError('Certification not found.', 404)
    if request.method == 'DELETE':
        if cert.file:
            file_name, storage = cert.file.name, cert.file.storage
            cert.file = ''
            cert.save(update_fields=['file'])
            transaction.on_commit(lambda: storage.delete(file_name))
    else:
        f, ext = upload(request, ('pdf', 'jpg', 'jpeg', 'png'), 5, 'Certificate file')
        signature = f.read(12)
        f.seek(0)
        valid = (ext == 'pdf' and signature.startswith(b'%PDF-')) or valid_image(f, ext)
        if not valid:
            raise ApiError('Choose a valid PDF, JPG or PNG certificate file.')
        old_file = cert.file.name if cert.file else ''
        storage = cert.file.storage
        cert.file.save(f'{cert.pk}.{ext}', f, save=True)
        if old_file:
            transaction.on_commit(lambda: storage.delete(old_file))
    return JsonResponse({'me': ser.s_student(request.me)})


@api('student')
def s_apps(request):
    need(request, 'POST')
    s = request.me
    j = Job.objects.filter(pk=request.data.get('job')).first()
    if not j: raise ApiError('Job not found.', 404)
    ok, msg = logic.can_apply(s, j)
    if not ok: raise ApiError(msg)
    a = Application.objects.create(student=s, job=j)
    StatusEvent.objects.create(application=a, status='Applied')
    logic.notify(s, f'You applied for {j.title} at {j.company.name}')
    logic.log(f'New application from {s.name} for {j.title}')
    return JsonResponse({'ok': True, 'id': a.id})


@api('student')
def s_app(request, pk):
    need(request, 'DELETE')
    a = Application.objects.filter(pk=pk, student=request.me).select_related('job').first()
    if not a: raise ApiError('Application not found.', 404)
    if a.status != 'Applied': raise ApiError('Only applications that are not yet shortlisted can be withdrawn.')
    logic.log(f'{request.me.name} withdrew the application for {a.job.title}')
    a.delete()
    return JsonResponse({'ok': True})


@api('student')
def s_read(request):
    qs = request.me.notifications.all()
    if request.data.get('id'): qs = qs.filter(pk=request.data['id'])
    qs.update(read=True)
    return JsonResponse({'ok': True})


@api('student')
def s_pw(request):
    need(request, 'POST')
    u, d = request.me.user, request.data
    if not u.check_password(d.get('old', '')): raise ApiError('Current password is wrong.')
    check_password(d.get('new'))
    u.set_password(d['new']); u.save()
    return JsonResponse({'ok': True})


@api('student')
def s_resource_open(request, pk):
    need(request, 'POST')
    resource = CareerResource.objects.filter(pk=pk, status='Published').first()
    if not resource:
        raise ApiError('Resource not found.', 404)
    if not resource.file and not resource.external_url:
        raise ApiError('This resource is not available.', 409)
    CareerResource.objects.filter(pk=resource.pk).update(downloads=F('downloads') + 1)
    resource.refresh_from_db(fields=['downloads'])
    return JsonResponse({'ok': True, 'url': resource.file.url if resource.file else resource.external_url,
                         'downloads': resource.downloads})


# ---------------------------------------------------------------- admin
@api('admin')
def a_boot(request):
    st, pol = Setting.get(), Setting.get()
    return JsonResponse({
        'admin': {'n': request.admin.get_full_name() or 'Admin', 'e': request.admin.email, 'org': st.org_name, 'ph': st.phone},
        'pol': {'one': int(pol.one_offer), 'dream': pol.dream_multiplier},
        'cos': [ser.s_company(c) for c in Company.objects.all()],
        'jobs': [ser.s_job(j) for j in Job.objects.all()],
        'st': [ser.s_student(s) for s in Student.objects.select_related('user').prefetch_related('projects', 'certs')],
        'apps': [ser.s_app(a) for a in Application.objects.prefetch_related('events')],
        'iv': [ser.s_interview(i) for i in Interview.objects.select_related('application').order_by('scheduled')],
        'resources': [ser.s_resource(r) for r in CareerResource.objects.order_by('-created')],
        'na': ser.s_notes(Activity.objects.order_by('-created')[:100])})


RESOURCE_CATEGORIES = ['Study Material', 'Career Guides', 'Interview Prep', 'Resume Templates',
                       'Placement Tips', 'Soft Skills', 'Courses', 'Tools', 'Articles', 'Others']
RESOURCE_TYPES = ['Guide', 'Course', 'Template', 'Tool', 'Article', 'Study Material', 'Video']


def resource_fields(resource, data, request):
    title = text(data.get('t'), 160)
    category, kind = text(data.get('cat'), 60), text(data.get('ty'), 24)
    status = text(data.get('st'), 10) or 'Draft'
    url = text(data.get('url'), 500)
    description = text(data.get('ds'), 2000)
    tags = data.get('tags', [])
    if isinstance(tags, str):
        tags = [x.strip() for x in tags.split(',')]
    if not isinstance(tags, list):
        raise ApiError('Enter resource tags as a list.')
    tags = [text(x, 32) for x in tags if text(x, 32)][:10]
    file = request.FILES.get('file')
    remove_file = str(data.get('removeFile', '')).lower() in ('1', 'true', 'on')
    if not title:
        raise ApiError('Enter a resource title.')
    if category not in RESOURCE_CATEGORIES:
        raise ApiError('Choose a valid resource category.')
    if kind not in RESOURCE_TYPES:
        raise ApiError('Choose a valid resource type.')
    if status not in CareerResource.RESOURCE_STATUSES:
        raise ApiError('Choose Published or Draft status.')
    if url and not url.startswith(('http://', 'https://')):
        raise ApiError('Resource link must start with http:// or https://.')
    if file and url:
        raise ApiError('Use either an uploaded file or a resource link, not both.')
    if file and remove_file:
        raise ApiError('Upload a file or remove the current file, not both.')
    if resource.file and url and not remove_file:
        raise ApiError('Remove the current file before adding an external link.')
    if remove_file and not url:
        raise ApiError('Add a resource link before removing its file.')
    if file:
        f, ext = upload(request, ('pdf', 'doc', 'docx', 'zip', 'mp4'), 50, 'Resource file')
        signature = f.read(12)
        f.seek(0)
        valid = (ext == 'pdf' and signature.startswith(b'%PDF-')) or \
                (ext == 'zip' and signature.startswith((b'PK\x03\x04', b'PK\x05\x06', b'PK\x07\x08'))) or \
                (ext in ('doc', 'docx') and signature.startswith(b'PK')) or \
                (ext == 'mp4' and len(signature) >= 8 and signature[4:8] == b'ftyp')
        if not valid:
            raise ApiError('Choose a valid PDF, DOC, DOCX, ZIP or MP4 resource.')
    if not file and not (url or (resource and resource.file and not remove_file)):
        raise ApiError('Upload a resource file or add an external link.')
    resource.title, resource.description, resource.category = title, description, category
    resource.resource_type, resource.tags, resource.external_url, resource.status = kind, tags, url, status
    resource.save()
    if remove_file:
        resource.file.delete(save=True)
    elif file:
        old_file = resource.file.name if resource.file else ''
        storage = resource.file.storage
        resource.file.save(f'{resource.pk}.{ext}', file, save=True)
        if old_file:
            transaction.on_commit(lambda: storage.delete(old_file))


def resource_request_data(request):
    if 'multipart/form-data' not in (request.content_type or ''):
        return request.data
    try:
        if request.method == 'PUT':
            request._post, request._files = MultiPartParser(
                request.META, request, request.upload_handlers
            ).parse()
        return request.POST
    except MultiPartParserError:
        raise ApiError('Invalid resource form data.')


@api('admin')
def a_resources(request):
    need(request, 'POST')
    resource = CareerResource()
    data = resource_request_data(request)
    resource_fields(resource, data, request)
    logic.log(f'Career resource created: {resource.title}')
    return JsonResponse({'ok': True, 'id': resource.id, 'resource': ser.s_resource(resource)})


@api('admin')
def a_resource(request, pk):
    resource = CareerResource.objects.filter(pk=pk).first()
    if not resource:
        raise ApiError('Resource not found.', 404)
    if request.method == 'DELETE':
        resource.delete()
    else:
        need(request, 'PUT')
        data = resource_request_data(request)
        resource_fields(resource, data, request)
        logic.log(f'Career resource updated: {resource.title}')
    return JsonResponse({'ok': True})


@api('admin')
def a_students(request):
    need(request, 'POST')
    d = request.data
    name, email = text(d.get('n'), 80), text(d.get('e')).lower()
    if len(name) < 2 or not EMAIL_RE.match(email): raise ApiError('Enter a name and a valid email.')
    if User.objects.filter(username=email).exists(): raise ApiError('A student with this email already exists.', 409)
    u = User.objects.create_user(username=email, email=email, password='student123', first_name=name)
    s = Student.objects.create(user=u)
    admin_fields(s, d)
    return JsonResponse({'ok': True, 'id': s.id})


def admin_fields(s, d):
    if d.get('ph'): s.phone = phone10(d['ph'])
    if d.get('d') in DEPARTMENTS: s.department = d['d']
    if 'pct' in d: s.score_type, s.score = 'Percentage', num(d['pct'], 0, 100, 'Percentage')
    if 'bk' in d: s.backlogs = int(num(d['bk'], 0, 30, 'Backlogs'))
    if d.get('s') in ('Active', 'Inactive'): s.status = d['s']
    s.save()


@api('admin')
def a_student(request, pk):
    s = Student.objects.filter(pk=pk).first()
    if not s: raise ApiError('Student not found.', 404)
    if request.method == 'DELETE':
        s.user.delete()                        # cascades to the student's data
    else:
        need(request, 'PUT')
        d = request.data
        if d.get('n'): s.user.first_name = text(d['n'], 80)
        if d.get('e'):
            e = text(d['e']).lower()
            if not EMAIL_RE.match(e) or User.objects.filter(username=e).exclude(pk=s.user_id).exists(): raise ApiError('Email is invalid or already used.')
            s.user.email = s.user.username = e
        s.user.save()
        admin_fields(s, d)
    return JsonResponse({'ok': True})


@api('admin')
def a_companies(request):
    need(request, 'POST')
    c = Company()
    company_fields(c, request.data)
    return JsonResponse({'ok': True, 'id': c.id})


def company_fields(c, d):
    name = text(d.get('n'), 120)
    if not name: raise ApiError('Enter the company name.')
    if Company.objects.filter(name__iexact=name).exclude(pk=c.pk).exists(): raise ApiError('This company already exists.')
    w = text(d.get('w'), 200)
    if w and not w.startswith(('http://', 'https://')): raise ApiError('Website must start with http:// or https://')
    c.name, c.website, c.phone, c.status = name, w, text(d.get('p'), 30), d.get('s') if d.get('s') in ('Active', 'Inactive') else 'Active'
    c.tagline, c.about = text(d.get('tg'), 120), text(d.get('ab'), 600)
    c.employees, c.countries = text(d.get('em'), 30), text(d.get('ct'), 30)
    c.save()


@api('admin')
def a_company_logo(request, pk):
    c = Company.objects.filter(pk=pk).first()
    if not c: raise ApiError('Company not found.', 404)
    if request.method == 'DELETE':
        c.logo.delete(save=False); c.logo = ''; c.save()
    else:
        need(request, 'POST')
        f, ext = upload(request, ('jpg', 'jpeg', 'png', 'webp'), 2, 'Logo')
        c.logo.delete(save=False)
        c.logo.save(f'{c.pk}.{ext}', f, save=True)
    return JsonResponse({'ok': True, 'co': ser.s_company(c)})


@api('admin')
def a_company(request, pk):
    c = Company.objects.filter(pk=pk).first()
    if not c: raise ApiError('Company not found.', 404)
    if request.method == 'DELETE': c.delete()
    else:
        need(request, 'PUT'); company_fields(c, request.data)
    return JsonResponse({'ok': True})


def job_fields(j, d):
    comp = Company.objects.filter(pk=d.get('c')).first()
    if not comp: raise ApiError('Select a company.')
    depts = [x for x in d.get('d', []) if x in DEPARTMENTS]
    skills = [text(x, 40) for x in d.get('sk', []) if text(x, 40)]
    if not text(d.get('t')) or not text(d.get('l')): raise ApiError('Enter the job title and location.')
    if not depts or not skills: raise ApiError('Select a department and add at least one skill.')
    j.title, j.company, j.location = text(d['t'], 120), comp, text(d['l'], 80)
    j.job_type = d.get('ty') if d.get('ty') in ('Full Time', 'Internship', 'Part Time') else 'Full Time'
    j.package, j.description = text(d.get('pk'), 40) or '-', text(d.get('ds'), 1500)
    j.category = d.get('cat') if d.get('cat') in CATEGORIES else CATEGORIES[0]
    j.min_percentage, j.min_10th, j.min_12th = num(d.get('min', 0), 0, 100, 'Minimum percentage'), num(d.get('m10', 0), 0, 100, '10th cut-off'), num(d.get('m12', 0), 0, 100, '12th cut-off')
    j.max_backlogs = int(num(d.get('mb', 0), 0, 20, 'Max backlogs'))
    j.departments, j.skills, j.deadline = depts, skills, date(d.get('dl'), 'Deadline')
    j.start_date, j.interview_date = opt_date(d.get('sd'), 'Application start date'), opt_date(d.get('ivd'), 'Interview date')
    if j.start_date and j.start_date > j.deadline: raise ApiError('The application start date must be on or before the last date to apply.')
    bn = d.get('bn') or []
    if isinstance(bn, str): bn = bn.splitlines()
    j.benefits = [text(x, 80) for x in bn if text(x, 80)][:8]
    j.experience, j.qualification = text(d.get('ex'), 40) or 'Freshers', text(d.get('ql'), 80)
    j.highlight = d.get('hl') if d.get('hl') in HIGHLIGHTS else ''
    j.save()


@api('admin')
def a_jobs(request):
    need(request, 'POST')
    j = Job()
    job_fields(j, request.data)
    n = logic.notify_job_candidates(
        j, 'job_announcement',
        f'New job: {j.title} at {j.company.name}, apply before {j.deadline:%d %b %Y}',
    )
    logic.log(f'Job posted: {j.title} at {j.company.name} ({n} eligible students notified)')
    return JsonResponse({'ok': True, 'id': j.id, 'notified': n})


@api('admin')
def a_job(request, pk):
    j = Job.objects.filter(pk=pk).first()
    if not j: raise ApiError('Job not found.', 404)
    if request.method == 'DELETE': j.delete()
    else:
        need(request, 'PUT'); job_fields(j, request.data)
    return JsonResponse({'ok': True})


@api('admin')
def a_notify(request, pk):
    need(request, 'POST')
    j = Job.objects.filter(pk=pk).select_related('company').first()
    if not j: raise ApiError('Job not found.', 404)
    n = logic.notify_job_candidates(
        j, 'job_announcement',
        f'New job: {j.title} at {j.company.name}, apply before {j.deadline:%d %b %Y}',
        exclude_applied=True, skip_job_notified=True,
    )
    logic.log(f'Notified {n} eligible students about {j.title}')
    return JsonResponse({'ok': True, 'notified': n})


@api('admin')
def a_job_ranking(request, pk):
    need(request, 'GET')
    job = Job.objects.filter(pk=pk).first()
    if not job: raise ApiError('Job not found.', 404)
    return JsonResponse({'rankings': logic.rank_applicants(job)})


@api('admin')
def a_app(request, pk):
    need(request, 'PUT')
    a = Application.objects.filter(pk=pk).select_related('student', 'job__company').first()
    if not a: raise ApiError('Application not found.', 404)
    if request.data.get('status') not in STATUSES: raise ApiError('Invalid status.')
    err = logic.set_status(a, request.data['status'])
    if err: raise ApiError(err, 409)
    return JsonResponse({'ok': True})


@api('admin')
def a_app_interviews(request, pk):
    need(request, 'POST')
    a = Application.objects.filter(pk=pk).select_related('student', 'job__company').first()
    if not a: raise ApiError('Application not found.', 404)
    if a.status in ('Rejected', 'Closed'):
        raise ApiError('An interview cannot be scheduled for a rejected or closed application.')
    scheduled = parse_datetime(text(request.data.get('at'), 40))
    if not scheduled:
        raise ApiError('Enter a valid interview date and time.')
    if timezone.is_naive(scheduled):
        scheduled = timezone.make_aware(scheduled, timezone.get_current_timezone())
    round_name = text(request.data.get('r'), 60) or 'Interview'
    mode = request.data.get('md')
    if mode not in ('On-campus', 'Online', 'Phone'):
        raise ApiError('Choose On-campus, Online or Phone for the interview mode.')
    interview = Interview.objects.create(
        application=a, scheduled=scheduled, round_name=round_name,
        mode=mode, location=text(request.data.get('lc'), 120))
    if a.status != 'Interview':
        err = logic.set_status(a, 'Interview', notify_student=False)
        if err:
            interview.delete()
            raise ApiError(err, 409)
    logic.log(f'{round_name} scheduled for {a.student.name}: {a.job.title}')
    return JsonResponse({'ok': True, 'interview': ser.s_interview(interview)})


@api('admin')
@transaction.atomic
def a_bulk(request):
    need(request, 'POST')
    status, ok, blocked = request.data.get('status'), 0, []
    if status not in STATUSES: raise ApiError('Invalid status.')
    ids = request.data.get('ids', [])
    if not isinstance(ids, list): raise ApiError('Invalid application list.')
    requested = Application.objects.filter(pk__in=ids)
    applications = requested
    from_status = request.data.get('from_status')
    if from_status:
        if from_status not in STATUSES: raise ApiError('Invalid source status.')
        applications = applications.filter(status=from_status)
        if request.data.get('job') is not None:
            applications = applications.filter(job_id=request.data['job'])
    skipped = max(0, requested.count() - applications.count()) if from_status else 0
    for a in applications.select_for_update().select_related('student__user', 'job__company'):
        err = logic.set_status(a, status)
        blocked.append(err) if err else None
        ok += 0 if err else 1
    return JsonResponse({'updated': ok, 'blocked': len(blocked), 'skipped': skipped, 'errors': blocked})


@api('admin')
def a_settings(request):
    need(request, 'PUT')
    d, st = request.data, Setting.get()
    if not text(d.get('org')): raise ApiError('Enter the organisation name.')
    st.org_name, st.phone = text(d['org'], 120), text(d.get('ph'), 30)
    st.save()
    e = text(d.get('e')).lower()
    if e and EMAIL_RE.match(e):
        request.admin.email = e; request.admin.save()
    return JsonResponse({'ok': True})


@api('admin')
def a_policy(request):
    need(request, 'PUT')
    st = Setting.get()
    st.one_offer = bool(request.data.get('one'))
    st.dream_multiplier = num(request.data.get('dream', 1.5), 1, 10, 'Dream offer multiplier')
    st.save()
    return JsonResponse({'ok': True})


@api('admin')
def a_pw(request):
    need(request, 'POST')
    u, d = request.admin, request.data
    if not u.check_password(d.get('old', '')): raise ApiError('Current password is wrong.')
    check_password(d.get('new'))
    u.set_password(d['new']); u.save()
    return JsonResponse({'ok': True})


@api('admin')
def a_read(request):
    Activity.objects.update(read=True)
    return JsonResponse({'ok': True})
