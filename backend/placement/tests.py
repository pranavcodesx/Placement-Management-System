"""Run with:  python manage.py test"""
import datetime, io, json, tempfile
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.test.client import encode_multipart
from django.utils import timezone
from . import logic
from .models import Application, CareerResource, Certification, Company, Interview, Job, Notification, Project, SavedJob, Setting, StatusEvent, Student


@override_settings(PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'], DEBUG=True)   # fast tests; DEBUG shows the reset code
class ApiTests(TestCase):
    def setUp(self):
        call_command('seed_demo', stdout=io.StringIO())

    def req(self, method, path, data=None, token=None, **kw):
        h = {'HTTP_AUTHORIZATION': f'Bearer {token}'} if token else {}
        if data is not None and not kw.get('files'):
            return getattr(self.client, method)('/api' + path, json.dumps(data), content_type='application/json', **h)
        return getattr(self.client, method)('/api' + path, data or {}, **h)

    def multipart_put(self, path, data, token):
        boundary = 'BoUnDaRyStRiNg'
        return self.client.generic(
            'PUT', '/api' + path, encode_multipart(boundary, data),
            content_type=f'multipart/form-data; boundary={boundary}',
            HTTP_AUTHORIZATION=f'Bearer {token}',
        )

    def login(self, email, pw, role='student'):
        r = self.req('post', '/auth/login', {'email': email, 'password': pw, 'role': role})
        self.assertEqual(r.status_code, 200, r.content)
        return r.json()['token']

    def test_login_roles_and_lockout(self):
        self.login('swara@example.com', 'student123')
        self.login('admin@careertrack.com', 'admin123', 'admin')
        self.assertEqual(self.req('post', '/auth/login', {'email': 'swara@example.com', 'password': 'student123', 'role': 'admin'}).status_code, 401)
        self.assertEqual(Student.objects.get(user__username='swara@example.com').name, 'Swara Narkar')
        for _ in range(5):
            self.req('post', '/auth/login', {'email': 'x@y.com', 'password': 'bad'})
        self.assertEqual(self.req('post', '/auth/login', {'email': 'x@y.com', 'password': 'bad'}).status_code, 429)

    def test_seed_demo_updates_legacy_student(self):
        student = Student.objects.get(user__username='swara@example.com')
        student.user.username = student.user.email = 'pranav@example.com'
        student.user.first_name = 'Pranav Sharma'
        student.user.save()
        student.gender = 'Male'
        student.save()
        call_command('seed_demo', stdout=io.StringIO())
        student.refresh_from_db()
        self.assertEqual(student.user.username, 'swara@example.com')
        self.assertEqual(student.name, 'Swara Narkar')
        self.assertEqual(student.gender, 'Female')

    def test_register_and_onboarding_wizard(self):
        r = self.req('post', '/auth/register', {'name': 'Test User', 'email': 't@x.com', 'phone': '9876543210', 'password': 'Pass1234'})
        self.assertEqual(r.status_code, 200, r.content)
        t = r.json()['token']
        self.assertEqual(self.req('post', '/auth/register', {'name': 'A', 'email': 'bad', 'phone': '1', 'password': 'x'}).status_code, 400)
        self.assertEqual(self.req('put', '/student/profile', {'finish': True}, t).status_code, 400)     # cannot finish early
        steps = [{'dob': '2003-07-15', 'gender': 'Male', 'loc': 'Pune', 'ad': '12 Road, Pune', 'step': 3},
                 {'col': 'ABC College', 'deg': 'B.Tech', 'd': 'IT', 'yr': '4th Year', 'py': 2026, 'p10': 90, 'p12': 85, 'sty': 'CGPA', 'sc': 8.5, 'bk': 0, 'step': 4},
                 {'skills': [{'n': 'Python', 'c': 'lang'}, {'n': 'SQL', 'c': 'tech'}, {'n': 'Django', 'c': 'fw'}, {'n': 'Teamwork', 'c': 'soft'}], 'step': 5}]
        for s in steps:
            self.assertEqual(self.req('put', '/student/profile', s, t).status_code, 200)
        me = self.req('put', '/student/profile', {'finish': True}, t).json()['me']
        self.assertTrue(me['ob'])
        self.assertEqual(me['pct'], 80.8)                      # 8.5 CGPA x 9.5
        self.assertEqual(me['sec']['skills'], True)
        up = self.client.post('/api/student/resume', {'file': SimpleUploadedFile('cv.pdf', b'%PDF-1.4 test')}, HTTP_AUTHORIZATION=f'Bearer {t}')
        self.assertEqual(up.status_code, 200, up.content)
        bad = self.client.post('/api/student/resume', {'file': SimpleUploadedFile('cv.exe', b'x')}, HTTP_AUTHORIZATION=f'Bearer {t}')
        self.assertEqual(bad.status_code, 400)

    def test_apply_rules(self):
        t = self.login('swara@example.com', 'student123')
        j2 = Job.objects.get(title='Software Engineer')               # Swara is eligible (67% skills)
        r = self.req('post', '/student/applications', {'job': j2.id}, t)
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(self.req('post', '/student/applications', {'job': j2.id}, t).status_code, 400)    # duplicate
        j3 = Job.objects.get(title='System Engineer')                  # needs Java -> skills below 60%
        self.assertEqual(self.req('post', '/student/applications', {'job': j3.id}, t).status_code, 400)
        a = Application.objects.get(student__user__username='swara@example.com', job=j2)
        self.assertEqual(self.req('delete', f'/student/applications/{a.id}', token=t).status_code, 200)      # withdraw
        j2.deadline = timezone.localdate() - datetime.timedelta(days=1); j2.save()
        self.assertIn('deadline', self.req('post', '/student/applications', {'job': j2.id}, t).json()['error'])

    def test_skill_gap_logic_uses_department_and_skill_threshold(self):
        student = Student(department='IT', skills=[{'n': 'Python'}, {'n': 'HTML'}])
        company = Company(name='Skill Gap Logic Test')
        jobs = [
            Job(title='SQL and CSS', company=company, departments=['IT'], skills=['python', 'HTML', 'SQL', 'CSS']),
            Job(title='SQL match', company=company, departments=['IT'], skills=['Python', 'html', 'sql']),
            Job(title='SQL still short', company=company, departments=['IT'], skills=['SQL', 'Python', 'HTML', 'CSS', 'JS', 'React']),
            Job(title='Wrong department', company=company, departments=['Mechanical'], skills=['SQL']),
        ]

        result = logic.skill_gap(student, jobs)
        sql = next(item for item in result if item['skill'] == 'SQL')
        self.assertEqual(sql, {
            'skill': 'SQL', 'job_count': 3,
            'job_titles': ['SQL and CSS', 'SQL match', 'SQL still short'],
            'more_jobs': 1,
        })
        self.assertNotIn('Wrong department', [title for item in result for title in item['job_titles']])
        self.assertEqual([x['n'] for x in student.skills], ['Python', 'HTML'])
        many_jobs = [
            Job(title=f'Kubernetes job {i}', company=company, departments=['IT'], skills=['Kubernetes'])
            for i in range(4)
        ] + [
            Job(title=f'Unique skill job {i}', company=company, departments=['IT'], skills=[f'UniqueSkill{i}'])
            for i in range(9)
        ]
        limited = logic.skill_gap(student, many_jobs)
        kubernetes = next(item for item in limited if item['skill'] == 'Kubernetes')
        self.assertEqual(len(limited), 8)
        self.assertEqual((kubernetes['job_count'], len(kubernetes['job_titles'])), (4, 3))

    def test_student_skill_gap_endpoint_only_uses_open_department_jobs(self):
        token = self.login('swara@example.com', 'student123')
        student = Student.objects.get(user__username='swara@example.com')
        student.department = 'IT'
        student.skills = [{'n': 'Python'}, {'n': 'HTML'}]
        student.save()
        company = Company.objects.first()
        today = timezone.localdate()
        Job.objects.filter(deadline__gte=today).update(deadline=today - datetime.timedelta(days=1))
        for title, departments, skills, deadline in (
            ('Skill Gap Open Novel', ['IT'], ['Python', 'HTML', 'SkillGapNovelXYZ', 'CSS'], today),
            ('Skill Gap Other Dept', ['Mechanical'], ['SkillGapNovelXYZ'], today + datetime.timedelta(days=5)),
            ('Skill Gap Expired', ['IT'], ['SkillGapNovelXYZ'], today - datetime.timedelta(days=1)),
        ):
            Job.objects.create(title=title, company=company, location='Pune', deadline=deadline,
                               departments=departments, skills=skills)

        response = self.req('get', '/student/skill-gap', token=token)
        self.assertEqual(response.status_code, 200, response.content)
        novel = next(item for item in response.json()['skills'] if item['skill'] == 'SkillGapNovelXYZ')
        self.assertEqual(novel['job_count'], 1)
        self.assertEqual(novel['job_titles'], ['Skill Gap Open Novel'])
        self.assertEqual(novel['more_jobs'], 1)
        self.assertEqual(self.req('get', '/student/skill-gap').status_code, 401)

    def test_applicant_ranking_order_ties_and_empty_job(self):
        company = Company.objects.first()
        job = Job.objects.create(
            title='Ranking Test Job', company=company, location='Pune',
            deadline=timezone.localdate() + datetime.timedelta(days=10),
            departments=['IT'], skills=['Python', 'SQL'], min_percentage=70,
        )

        def applicant(name, *, skills, percentage, p10, p12, backlogs):
            user = User.objects.create_user(username=name.lower().replace(' ', '.'), password='test1234',
                                            first_name=name.split()[0], last_name=' '.join(name.split()[1:]))
            student = Student.objects.create(
                user=user, department='IT', skills=[{'n': skill} for skill in skills],
                score_type='Percentage', score=percentage, p10=p10, p12=p12, backlogs=backlogs,
            )
            return Application.objects.create(student=student, job=job)

        best = applicant('Best Candidate', skills=['Python', 'SQL'], percentage=90, p10=90, p12=90, backlogs=0)
        Project.objects.create(student=best.student, name='Placement portal')
        Certification.objects.create(student=best.student, name='Python certification')
        applicant('Tie Alpha', skills=['Python'], percentage=70, p10=80, p12=80, backlogs=1)
        applicant('Tie Beta', skills=['Python'], percentage=70, p10=80, p12=80, backlogs=1)
        ranked = logic.rank_applicants(job)
        self.assertEqual([item['student_name'] for item in ranked],
                         ['Best Candidate', 'Tie Alpha', 'Tie Beta'])
        self.assertEqual(ranked[1]['score'], ranked[2]['score'])
        self.assertEqual(ranked[0]['breakdown'], {
            'skills': 50, 'graduation': 25, 'school': 9, 'backlogs': 10, 'portfolio': 2,
        })
        self.assertEqual(ranked[0]['score'], 96)

        empty_job = Job.objects.create(
            title='No Applicants Job', company=company, location='Remote',
            deadline=timezone.localdate() + datetime.timedelta(days=10),
            departments=['IT'], skills=['Go'],
        )
        self.assertEqual(logic.rank_applicants(empty_job), [])

    def test_admin_applicant_ranking_endpoint(self):
        admin = self.login('admin@careertrack.com', 'admin123', 'admin')
        job = Job.objects.first()
        response = self.req('get', f'/admin/jobs/{job.pk}/ranking', token=admin)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertIn('rankings', response.json())
        self.assertEqual(self.req('get', f'/admin/jobs/{job.pk}/ranking').status_code, 401)
        student = self.login('swara@example.com', 'student123')
        self.assertEqual(self.req('get', f'/admin/jobs/{job.pk}/ranking', token=student).status_code, 403)

    def test_ranked_shortlist_uses_status_history_and_skips_changed_apps(self):
        admin = self.login('admin@careertrack.com', 'admin123', 'admin')
        job = Job.objects.first()
        applications = []
        for username, status in (('rankapplied@example.com', 'Applied'), ('rankselected@example.com', 'Selected')):
            user = User.objects.create_user(username=username, password='test1234', first_name=username.split('@')[0])
            student = Student.objects.create(user=user)
            application = Application.objects.create(student=student, job=job, status=status)
            StatusEvent.objects.create(application=application, status=status)
            applications.append(application)
        student = applications[0].student
        notices_before = Notification.objects.filter(student=student).count()

        response = self.req('post', '/admin/applications/bulk', {
            'ids': [application.pk for application in applications],
            'status': 'Shortlisted', 'from_status': 'Applied', 'job': job.pk,
        }, admin)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual((response.json()['updated'], response.json()['skipped']), (1, 1))
        applications[0].refresh_from_db()
        applications[1].refresh_from_db()
        self.assertEqual((applications[0].status, applications[1].status), ('Shortlisted', 'Selected'))
        self.assertEqual(list(applications[0].events.order_by('date', 'id').values_list('status', flat=True)),
                         ['Applied', 'Shortlisted'])
        self.assertEqual(Notification.objects.filter(student=student).count(), notices_before + 1)

    def test_resume_required_to_apply(self):
        s = Student.objects.get(user__username='swara@example.com'); s.resume = ''; s.save()
        t = self.login('swara@example.com', 'student123')
        r = self.req('post', '/student/applications', {'job': Job.objects.get(title='Software Engineer').id}, t)
        self.assertIn('resume', r.json()['error'])

    def test_certification_image_upload_update_and_remove(self):
        token = self.login('swara@example.com', 'student123')
        with tempfile.TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            profile = self.req('put', '/student/profile', {'ce': [{'n': 'Cloud Fundamentals', 'o': 'Example Academy', 'y': '2026'}]}, token).json()['me']
            cert_data = profile['ce'][0]
            cert = Certification.objects.get(pk=cert_data['id'])
            upload = self.client.post(
                f'/api/student/certifications/{cert.pk}/image',
                {'file': SimpleUploadedFile('certificate.png', b'\x89PNG\r\n\x1a\ncertificate image')},
                HTTP_AUTHORIZATION=f'Bearer {token}',
            )
            self.assertEqual(upload.status_code, 200, upload.content)
            self.assertIn('/media/certificates/', upload.json()['me']['ce'][0]['img'])
            cert.refresh_from_db()
            image_name = cert.image.name

            updated = self.req('put', '/student/profile', {'ce': [{'id': cert.pk, 'n': 'Cloud Foundations', 'o': 'Example Academy', 'y': '2026'}]}, token)
            self.assertEqual(updated.status_code, 200, updated.content)
            cert.refresh_from_db()
            self.assertEqual(cert.image.name, image_name)
            self.assertEqual(cert.name, 'Cloud Foundations')

            invalid = self.client.post(
                f'/api/student/certifications/{cert.pk}/image',
                {'file': SimpleUploadedFile('certificate.exe', b'not an image')},
                HTTP_AUTHORIZATION=f'Bearer {token}',
            )
            self.assertEqual(invalid.status_code, 400)
            invalid_image = self.client.post(
                f'/api/student/certifications/{cert.pk}/image',
                {'file': SimpleUploadedFile('certificate.png', b'not actually a png')},
                HTTP_AUTHORIZATION=f'Bearer {token}',
            )
            self.assertEqual(invalid_image.status_code, 400)
            removed = self.client.delete(f'/api/student/certifications/{cert.pk}/image', HTTP_AUTHORIZATION=f'Bearer {token}')
            self.assertEqual(removed.status_code, 200, removed.content)
            cert.refresh_from_db()
            self.assertFalse(cert.image)

    def test_project_and_certificate_details_and_uploads(self):
        token = self.login('swara@example.com', 'student123')
        with tempfile.TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            profile = self.req('put', '/student/profile', {
                'pr': [{'n': 'Portfolio app', 'ds': 'A student portfolio', 'tk': 'React, Django',
                        'lk': 'https://github.com/example/app', 'demo': 'https://demo.example.com', 'st': 'Draft'}],
                'ce': [{'n': 'Cloud Fundamentals', 'o': 'Example Academy', 'idat': '2026-03-15',
                        'cid': 'CF-2026-001', 'vl': 'https://verify.example.com/CF-2026-001'}],
            }, token).json()['me']
            project_data, cert_data = profile['pr'][0], profile['ce'][0]
            project = Project.objects.get(pk=project_data['id'])
            cert = Certification.objects.get(pk=cert_data['id'])
            self.assertEqual(project.status, 'Draft')
            self.assertEqual(project.demo_link, 'https://demo.example.com')
            self.assertEqual(cert.issue_date, datetime.date(2026, 3, 15))
            self.assertEqual(cert.credential_id, 'CF-2026-001')

            project_upload = self.req(
                'post', f'/student/projects/{project.pk}/thumbnail',
                {'file': SimpleUploadedFile('thumbnail.png', b'\x89PNG\r\n\x1a\nproject thumbnail')},
                token, files=True,
            )
            self.assertEqual(project_upload.status_code, 200, project_upload.content)
            self.assertIn('/media/projects/', project_upload.json()['me']['pr'][0]['thumb'])

            cert_upload = self.req(
                'post', f'/student/certifications/{cert.pk}/file',
                {'file': SimpleUploadedFile('certificate.pdf', b'%PDF-1.4 certificate')},
                token, files=True,
            )
            self.assertEqual(cert_upload.status_code, 200, cert_upload.content)
            self.assertIn('/media/certificates/files/', cert_upload.json()['me']['ce'][0]['file'])

            updated = self.req('put', '/student/profile', {
                'pr': [{'id': project.pk, 'n': 'Portfolio app', 'ds': 'Updated description',
                        'tk': 'React, Django', 'lk': 'https://github.com/example/app',
                        'demo': 'https://demo.example.com', 'st': 'Published'}],
                'ce': [{'id': cert.pk, 'n': 'Cloud Fundamentals', 'o': 'Example Academy',
                        'idat': '2026-03-15', 'cid': 'CF-2026-001',
                        'vl': 'https://verify.example.com/CF-2026-001'}],
            }, token).json()['me']
            project.refresh_from_db()
            cert.refresh_from_db()
            self.assertEqual(project.status, 'Published')
            self.assertTrue(project.thumbnail)
            self.assertTrue(cert.file)
            self.assertEqual(updated['ce'][0]['cid'], 'CF-2026-001')

            invalid_file = self.req(
                'post', f'/student/certifications/{cert.pk}/file',
                {'file': SimpleUploadedFile('certificate.pdf', b'not a PDF')},
                token, files=True,
            )
            self.assertEqual(invalid_file.status_code, 400)
            self.assertEqual(self.req('delete', f'/student/projects/{project.pk}/thumbnail', token=token).status_code, 200)
            self.assertEqual(self.req('delete', f'/student/certifications/{cert.pk}/file', token=token).status_code, 200)
            project.refresh_from_db()
            cert.refresh_from_db()
            self.assertFalse(project.thumbnail)
            self.assertFalse(cert.file)

    def test_invalid_project_update_preserves_existing_projects(self):
        token = self.login('swara@example.com', 'student123')
        saved = self.req('put', '/student/profile', {'pr': [{'n': 'Portfolio project', 'lk': 'https://example.com'}]}, token)
        self.assertEqual(saved.status_code, 200, saved.content)
        project = Project.objects.get(student__user__username='swara@example.com')

        invalid = self.req('put', '/student/profile', {'pr': [{'n': 'Portfolio project', 'lk': 'javascript:alert(1)'}]}, token)
        self.assertEqual(invalid.status_code, 400)
        project.refresh_from_db()
        self.assertEqual(project.name, 'Portfolio project')
        self.assertEqual(project.link, 'https://example.com')

    def test_one_offer_policy(self):
        at = self.login('admin@careertrack.com', 'admin123', 'admin')
        rahul = Student.objects.get(user__username='rahul@college.com')           # already selected at Google (8 LPA)
        low = Job.objects.get(title='System Engineer')                           # 6 LPA < 8 x 1.5
        a = Application.objects.create(student=rahul, job=low)
        r = self.req('put', f'/admin/applications/{a.id}', {'status': 'Selected'}, at)
        self.assertEqual(r.status_code, 409, r.content)
        self.assertEqual(self.req('put', '/admin/policy', {'one': False, 'dream': 1.5}, at).status_code, 200)
        self.assertEqual(self.req('put', f'/admin/applications/{a.id}', {'status': 'Selected'}, at).status_code, 200)
        self.assertTrue(Notification.objects.filter(student=rahul, text__contains='is now Selected').exists())

    def test_admin_crud_and_notify(self):
        at = self.login('admin@careertrack.com', 'admin123', 'admin')
        boot = self.req('get', '/admin/bootstrap', token=at).json()
        self.assertEqual(len(boot['st']), 12)
        job = {'t': 'QA Engineer', 'c': boot['cos'][0]['id'], 'l': 'Pune', 'ty': 'Full Time', 'pk': '4 - 5 LPA', 'min': 55, 'mb': 1, 'm10': 0, 'm12': 0,
               'sk': ['SQL', 'Python'], 'd': ['Computer Engineering', 'IT'], 'cat': 'IT & Software', 'dl': (timezone.localdate() + datetime.timedelta(days=10)).isoformat(), 'ds': 'x'}
        r = self.req('post', '/admin/jobs', job, at)
        self.assertEqual(r.status_code, 200, r.content)
        self.assertGreater(r.json()['notified'], 0)
        posted_job = Job.objects.get(pk=r.json()['id'])
        announcement = Notification.objects.filter(job=posted_job, kind='job_announcement')
        self.assertEqual(announcement.count(), r.json()['notified'])
        self.assertTrue(announcement.first().text.startswith(
            f'New job: {posted_job.title} at {posted_job.company.name}, apply before '
        ))
        manual = self.req('post', f'/admin/jobs/{posted_job.pk}/notify', {}, at)
        self.assertEqual(manual.status_code, 200, manual.content)
        self.assertEqual(manual.json()['notified'], 0)
        self.assertEqual(announcement.count(), r.json()['notified'])
        self.assertEqual(self.req('post', '/admin/jobs', {**job, 'd': []}, at).status_code, 400)
        self.assertEqual(self.req('delete', f"/admin/jobs/{r.json()['id']}", token=at).status_code, 200)
        self.assertEqual(self.req('get', '/admin/bootstrap').status_code, 401)
        st = self.login('swara@example.com', 'student123')
        self.assertEqual(self.req('get', '/admin/bootstrap', token=st).status_code, 403)          # students cannot use admin API

    def test_manual_job_notify_skips_legacy_job_notice(self):
        admin = self.login('admin@careertrack.com', 'admin123', 'admin')
        student = Student.objects.get(user__username='swara@example.com')
        student.department = 'IT'
        student.skills = []
        student.save()
        job = Job.objects.create(
            title='Legacy Notice Job', company=Company.objects.first(), location='Pune',
            deadline=timezone.localdate() + datetime.timedelta(days=5),
            departments=['IT'], skills=[],
        )
        legacy = Notification.objects.create(
            student=student,
            text=f'New job opportunity: {job.title} at {job.company.name}. Apply before {job.deadline:%d %b %Y}',
        )
        notice_count = Notification.objects.filter(student=student).count()

        response = self.req('post', f'/admin/jobs/{job.pk}/notify', {}, admin)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(Notification.objects.filter(student=student).count(), notice_count)
        self.assertIsNone(Notification.objects.filter(student=student, job=job).first())
        self.assertTrue(Notification.objects.filter(pk=legacy.pk).exists())

    def test_password_reset_and_public(self):
        r = self.req('post', '/auth/forgot', {'email': 'swara@example.com'}).json()
        self.assertEqual(self.req('post', '/auth/reset', {'email': 'swara@example.com', 'code': r['dev_code'], 'password': 'NewPass99'}).status_code, 200)
        self.login('swara@example.com', 'NewPass99')
        o = self.req('get', '/public/overview').json()
        self.assertEqual(o['stats']['cos'], 8)
        self.assertEqual(self.req('post', '/public/contact', {'name': 'A', 'email': 'a@b.com', 'message': 'Hi'}).status_code, 200)

    def test_dashboard_interviews_in_bootstrap(self):
        d = self.req('get', '/student/bootstrap', token=self.login('swara@example.com', 'student123')).json()
        self.assertEqual(len(d['iv']), 2)
        self.assertTrue({i['a'] for i in d['iv']} <= {a['id'] for a in d['apps']})    # only her own applications
        email = Student.objects.exclude(user__username='swara@example.com').first().user.username
        other = self.req('get', '/student/bootstrap', token=self.login(email, 'student123')).json()
        self.assertEqual(other['iv'], [])

    def test_application_stages_and_admin_scheduled_interview(self):
        admin = self.login('admin@careertrack.com', 'admin123', 'admin')
        student = self.login('swara@example.com', 'student123')
        app = Application.objects.filter(student__user__username='swara@example.com').exclude(
            status__in=('Rejected', 'Closed')).first()
        self.assertIsNotNone(app)
        review = self.req('put', f'/admin/applications/{app.pk}', {'status': 'In Review'}, admin)
        self.assertEqual(review.status_code, 200, review.content)
        shortlist = self.req('put', f'/admin/applications/{app.pk}', {'status': 'Shortlisted'}, admin)
        self.assertEqual(shortlist.status_code, 200, shortlist.content)
        scheduled = timezone.now() + datetime.timedelta(days=2)
        notices_before = Notification.objects.filter(student=app.student).count()
        interview = self.req('post', f'/admin/applications/{app.pk}/interviews', {
            'at': scheduled.isoformat(), 'r': 'Technical Round', 'md': 'Online', 'lc': 'https://meet.example.com/round'
        }, admin)
        self.assertEqual(interview.status_code, 200, interview.content)
        app.refresh_from_db()
        self.assertEqual(app.status, 'Interview')
        self.assertEqual(Notification.objects.filter(student=app.student).count(), notices_before + 1)
        history = list(app.events.order_by('date').values_list('status', flat=True))
        self.assertEqual(history[-3:], ['In Review', 'Shortlisted', 'Interview'])
        student_boot = self.req('get', '/student/bootstrap', token=student).json()
        visible_app = next(a for a in student_boot['apps'] if a['id'] == app.pk)
        self.assertEqual(visible_app['st'], 'Interview')
        scheduled_round = next(i for i in student_boot['iv'] if i['a'] == app.pk and i['r'] == 'Technical Round')
        self.assertEqual(scheduled_round['a'], app.pk)
        selected = self.req('put', f'/admin/applications/{app.pk}', {'status': 'Selected'}, admin)
        self.assertEqual(selected.status_code, 200, selected.content)
        closed = self.req('put', f'/admin/applications/{app.pk}', {'status': 'Closed'}, admin)
        self.assertEqual(closed.status_code, 200, closed.content)
        closed_app = next(a for a in self.req('get', '/student/bootstrap', token=student).json()['apps'] if a['id'] == app.pk)
        self.assertEqual(closed_app['st'], 'Closed')
        self.assertEqual(closed_app['h'][-1]['st'], 'Closed')

    def test_interview_signal_notifies_only_when_created(self):
        student = Student.objects.get(user__username='swara@example.com')
        application = student.applications.first()
        before = Notification.objects.filter(student=student).count()
        interview = Interview.objects.create(
            application=application, scheduled=timezone.now() + datetime.timedelta(days=2),
            round_name='Signal Round', mode='Online',
        )
        self.assertEqual(Notification.objects.filter(student=student).count(), before + 1)
        self.assertTrue(Notification.objects.filter(
            student=student, text__contains='Signal Round scheduled',
        ).exists())
        interview.location = 'Updated meeting link'
        interview.save()
        self.assertEqual(Notification.objects.filter(student=student).count(), before + 1)

    def test_deadline_reminders_are_eligible_unapplied_and_idempotent(self):
        today = timezone.localdate()
        Job.objects.all().update(deadline=today + datetime.timedelta(days=10))
        company = Company.objects.first()
        student = Student.objects.get(user__username='swara@example.com')
        student.department = 'IT'
        student.skills = []
        student.save()
        expiring_jobs = [
            Job.objects.create(
                title=f'Reminder Job {offset}', company=company, location='Pune',
                deadline=today + datetime.timedelta(days=offset),
                departments=['IT'], skills=[],
            )
            for offset in (0, 2, 3)
        ]
        applied_student = Student.objects.exclude(pk=student.pk).filter(status='Active', onboarded=True).first()
        self.assertIsNotNone(applied_student)
        Application.objects.create(student=applied_student, job=expiring_jobs[0])

        from django.core.management import call_command
        out = io.StringIO()
        call_command('send_deadline_reminders', stdout=out)
        reminders = Notification.objects.filter(kind='deadline_reminder')
        self.assertGreater(reminders.count(), 0)
        self.assertFalse(reminders.filter(job=expiring_jobs[2]).exists())
        self.assertFalse(reminders.filter(job=expiring_jobs[0], student=applied_student).exists())
        self.assertTrue(reminders.filter(job=expiring_jobs[0], student=student).exists())
        self.assertIn('Sent ', out.getvalue())
        first_count = reminders.count()

        call_command('send_deadline_reminders', stdout=io.StringIO())
        self.assertEqual(Notification.objects.filter(kind='deadline_reminder').count(), first_count)

    def test_job_detail_fields_and_company_profile(self):
        at, c = self.login('admin@careertrack.com', 'admin123', 'admin'), Company.objects.first()
        today = timezone.localdate()
        job = {'t': 'QA Engineer', 'c': c.id, 'l': 'Pune', 'ty': 'Internship', 'pk': '3 - 4 LPA', 'cat': 'IT & Software', 'min': 55, 'mb': 1,
               'sk': ['Testing'], 'dl': str(today + datetime.timedelta(days=20)), 'ds': 'Test the product\nWrite test plans', 'd': ['IT'],
               'sd': str(today), 'ivd': str(today + datetime.timedelta(days=30)), 'ex': '0 - 1 Year', 'ql': 'B.E / B.Tech',
               'bn': 'Health insurance\n\nFlexible hours', 'hl': 'Featured'}
        r = self.req('post', '/admin/jobs', job, at)
        self.assertEqual(r.status_code, 200, r.content)
        j = Job.objects.get(pk=r.json()['id'])
        self.assertEqual((j.benefits, j.highlight, j.experience, j.job_type), (['Health insurance', 'Flexible hours'], 'Featured', '0 - 1 Year', 'Internship'))
        self.assertEqual(self.req('post', '/admin/jobs', {**job, 'sd': str(today + datetime.timedelta(days=40))}, at).status_code, 400)   # starts after deadline
        self.assertEqual(self.req('put', f'/admin/jobs/{j.id}', {**job, 'hl': 'Nonsense', 'ivd': ''}, at).status_code, 200)
        j.refresh_from_db(); self.assertEqual((j.highlight, j.interview_date), ('', None))
        self.assertEqual(self.req('put', f'/admin/companies/{c.id}', {'n': c.name, 'tg': 'Hello', 'ab': 'About us', 'em': '1L+', 'ct': '10+'}, at).status_code, 200)
        d = self.req('get', '/student/bootstrap', token=self.login('swara@example.com', 'student123')).json()
        sj = next(x for x in d['jobs'] if x['id'] == j.id)
        self.assertEqual((sj['ex'], sj['ql'], sj['bn'], sj['ivd']), ('0 - 1 Year', 'B.E / B.Tech', ['Health insurance', 'Flexible hours'], ''))
        self.assertEqual(sj['sd'], str(today))
        sc = next(x for x in d['cos'] if x['id'] == c.id)
        self.assertEqual((sc['tg'], sc['ab'], sc['em'], sc['ct']), ('Hello', 'About us', '1L+', '10+'))
        self.assertIn('pl', d)

    def test_company_logo_upload_rules(self):
        at, c = self.login('admin@careertrack.com', 'admin123', 'admin'), Company.objects.first()
        with tempfile.TemporaryDirectory() as tmp, override_settings(MEDIA_ROOT=tmp):
            bad = self.req('post', f'/admin/companies/{c.id}/logo', {'file': SimpleUploadedFile('x.txt', b'hi')}, at, files=True)
            self.assertEqual(bad.status_code, 400)
            ok = self.req('post', f'/admin/companies/{c.id}/logo', {'file': SimpleUploadedFile('logo.png', b'\x89PNG\r\n\x1a\n' + b'0' * 50)}, at, files=True)
            self.assertEqual(ok.status_code, 200, ok.content)
            self.assertTrue(ok.json()['co']['lg'].endswith('.png'))
            self.assertEqual(self.req('delete', f'/admin/companies/{c.id}/logo', token=at).json()['co']['lg'], '')

    def test_saved_jobs_toggle(self):
        tok, j = self.login('swara@example.com', 'student123'), Job.objects.first()
        self.assertEqual(self.req('post', '/student/saved', {'job': j.id, 'on': True}, tok).status_code, 200)
        self.req('post', '/student/saved', {'job': j.id, 'on': True}, tok)                     # saving twice keeps one row
        self.assertEqual(SavedJob.objects.filter(job=j).count(), 1)
        self.assertEqual(self.req('get', '/student/bootstrap', token=tok).json()['sv'], [j.id])
        other = self.login('rahul@college.com', 'student123')
        self.assertEqual(self.req('get', '/student/bootstrap', token=other).json()['sv'], [])
        self.req('post', '/student/saved', {'job': j.id, 'on': False}, tok)
        self.assertEqual(SavedJob.objects.count(), 0)
        self.assertEqual(self.req('post', '/student/saved', {'job': 99999, 'on': True}, tok).status_code, 404)

    def test_resource_admin_crud_student_visibility_and_open_tracking(self):
        admin = self.login('admin@careertrack.com', 'admin123', 'admin')
        student = self.login('swara@example.com', 'student123')
        payload = {'t': 'Resume Writing Guide', 'ds': 'Build a clear, recruiter-friendly resume.',
                   'cat': 'Resume Templates', 'ty': 'Guide', 'tags': ['Resume', 'Career'],
                   'url': 'https://example.com/resume-guide', 'st': 'Published'}
        created = self.req('post', '/admin/resources', payload, admin)
        self.assertEqual(created.status_code, 200, created.content)
        resource_id = created.json()['id']
        draft = self.req('post', '/admin/resources', {**payload, 't': 'Interview Notes', 'st': 'Draft'}, admin)
        self.assertEqual(draft.status_code, 200, draft.content)
        admin_boot = self.req('get', '/admin/bootstrap', token=admin).json()
        self.assertEqual({r['id'] for r in admin_boot['resources']}, {resource_id, draft.json()['id']})
        student_boot = self.req('get', '/student/bootstrap', token=student).json()
        self.assertEqual([r['id'] for r in student_boot['resources']], [resource_id])
        opened = self.req('post', f'/student/resources/{resource_id}/open', {}, student)
        self.assertEqual(opened.status_code, 200, opened.content)
        self.assertEqual(opened.json()['url'], payload['url'])
        self.assertEqual(CareerResource.objects.get(pk=resource_id).downloads, 1)
        self.assertEqual(self.req('post', f'/student/resources/{draft.json()["id"]}/open', {}, student).status_code, 404)
        updated = self.req('put', f'/admin/resources/{resource_id}',
                           {**payload, 't': 'Updated Resume Guide', 'cat': 'Career Guides'}, admin)
        self.assertEqual(updated.status_code, 200, updated.content)
        self.assertEqual(CareerResource.objects.get(pk=resource_id).title, 'Updated Resume Guide')
        multipart_updated = self.multipart_put(f'/admin/resources/{resource_id}',
                                               {**payload, 't': 'Multipart Resume Guide'}, admin)
        self.assertEqual(multipart_updated.status_code, 200, multipart_updated.content)
        self.assertEqual(CareerResource.objects.get(pk=resource_id).title, 'Multipart Resume Guide')
        self.assertEqual(self.req('delete', f'/admin/resources/{draft.json()["id"]}', token=admin).status_code, 200)
        self.assertEqual(self.req('post', '/admin/resources', payload, student).status_code, 403)
        self.assertEqual(self.req('post', f'/student/resources/{resource_id}/open', {}, admin).status_code, 403)
        self.assertEqual(self.req('get', '/admin/bootstrap').status_code, 401)

    def test_resource_upload_validation_and_removal(self):
        admin = self.login('admin@careertrack.com', 'admin123', 'admin')
        payload = {'t': 'Aptitude Practice Set', 'ds': 'Practice questions.', 'cat': 'Study Material',
                   'ty': 'Study Material', 'tags': 'Math, Aptitude', 'st': 'Published'}
        with tempfile.TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            invalid = self.req('post', '/admin/resources', {**payload, 'file': SimpleUploadedFile('set.pdf', b'not a PDF')}, admin, files=True)
            self.assertEqual(invalid.status_code, 400)
            uploaded = self.req('post', '/admin/resources', {**payload, 'file': SimpleUploadedFile('set.pdf', b'%PDF-1.4 practice set')}, admin, files=True)
            self.assertEqual(uploaded.status_code, 200, uploaded.content)
            resource = CareerResource.objects.get(pk=uploaded.json()['id'])
            self.assertTrue(resource.file.name.endswith('.pdf'))
            updated = self.multipart_put(f'/admin/resources/{resource.pk}',
                                         {**payload, 't': 'Updated Aptitude Practice Set',
                                          'file': SimpleUploadedFile('updated.pdf', b'%PDF-1.4 updated practice set')},
                                         admin)
            self.assertEqual(updated.status_code, 200, updated.content)
            resource.refresh_from_db()
            self.assertEqual(resource.title, 'Updated Aptitude Practice Set')
            self.assertTrue(resource.file.name.endswith('.pdf'))
            student = self.login('swara@example.com', 'student123')
            opened = self.req('post', f'/student/resources/{resource.pk}/open', {}, student)
            self.assertEqual(opened.status_code, 200, opened.content)
            self.assertIn('/media/resources/', opened.json()['url'])
            self.assertEqual(self.req('put', f'/admin/resources/{resource.pk}',
                                      {**payload, 'url': 'javascript:alert(1)'}, admin).status_code, 400)
            self.assertEqual(self.req('put', f'/admin/resources/{resource.pk}',
                                      {**payload, 'url': 'https://example.com', 'removeFile': '1'}, admin).status_code, 200)
            resource.refresh_from_db()
            self.assertFalse(resource.file)
            self.assertEqual(resource.external_url, 'https://example.com')
            self.assertEqual(self.req('post', '/admin/resources', {**payload, 'url': '', 'file': ''}, admin).status_code, 400)
