from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from . import logic
from .models import Interview


@receiver(post_save, sender=Interview)
def notify_interview_created(sender, instance, created, **kwargs):
    if not created:
        return
    application = instance.application
    scheduled = timezone.localtime(instance.scheduled)
    logic.notify(
        application.student,
        f'{instance.round_name} scheduled for {application.job.title} at {application.job.company.name} on {scheduled:%d %b %Y, %I:%M %p}',
    )
