from django.contrib import admin
from . import models

for m in (models.Company, models.Job, models.Student, models.Application, models.Interview, models.Notification,
          models.Activity, models.Setting, models.ContactMessage):
    admin.site.register(m)
