from django.urls import path
from . import views as v

urlpatterns = [
    path('auth/register', v.register), path('auth/login', v.login), path('auth/logout', v.logout),
    path('auth/forgot', v.forgot), path('auth/reset', v.reset),
    path('public/overview', v.overview), path('public/contact', v.contact),
    path('student/bootstrap', v.s_boot), path('student/profile', v.s_profile), path('student/photo', v.s_photo),
    path('student/skill-gap', v.s_skill_gap),
    path('student/projects/<int:pk>/thumbnail', v.s_project_thumbnail),
    path('student/certifications/<int:pk>/image', v.s_cert_image),
    path('student/certifications/<int:pk>/file', v.s_cert_file),
    path('student/resume', v.s_resume), path('student/applications', v.s_apps), path('student/saved', v.s_saved),
    path('student/applications/<int:pk>', v.s_app), path('student/notifications/read', v.s_read),
    path('student/resources/<int:pk>/open', v.s_resource_open),
    path('student/password', v.s_pw),
    path('admin/bootstrap', v.a_boot), path('admin/students', v.a_students), path('admin/students/<int:pk>', v.a_student),
    path('admin/companies', v.a_companies), path('admin/companies/<int:pk>', v.a_company), path('admin/companies/<int:pk>/logo', v.a_company_logo),
    path('admin/jobs', v.a_jobs), path('admin/jobs/<int:pk>', v.a_job), path('admin/jobs/<int:pk>/notify', v.a_notify),
    path('admin/jobs/<int:pk>/ranking', v.a_job_ranking),
    path('admin/applications/<int:pk>/interviews', v.a_app_interviews),
    path('admin/resources', v.a_resources), path('admin/resources/<int:pk>', v.a_resource),
    path('admin/applications/bulk', v.a_bulk), path('admin/applications/<int:pk>', v.a_app),
    path('admin/settings', v.a_settings), path('admin/policy', v.a_policy), path('admin/password', v.a_pw),
    path('admin/notifications/read', v.a_read),
]
