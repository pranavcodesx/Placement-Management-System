"""One server for everything:  /api/ (backend)  /  (student portal)  /admin-panel/ (admin panel)."""
from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve


def frontend(request, path='', root=None):
    """Serve a static front-end folder (index.html for folders)."""
    if not path or path.endswith('/'):
        path += 'index.html'
    return serve(request, path, document_root=root)


urlpatterns = [
    path('api/', include('placement.urls')),
    path('django-admin/', admin.site.urls),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    path('admin-panel/', frontend, {'root': settings.ADMIN_DIR}),
    re_path(r'^admin-panel/(?P<path>.+)$', frontend, {'root': settings.ADMIN_DIR}),
    re_path(r'^(?P<path>.*)$', frontend, {'root': settings.STUDENT_DIR}),
]
