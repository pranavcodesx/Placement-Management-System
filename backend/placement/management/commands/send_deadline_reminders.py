import datetime

from django.core.management.base import BaseCommand
from django.utils import timezone

from placement import logic
from placement.models import Job


class Command(BaseCommand):
    help = 'Notify eligible students who have not applied to jobs closing within two days'

    def handle(self, *args, **options):
        today = timezone.localdate()
        deadline = today + datetime.timedelta(days=2)
        jobs = Job.objects.filter(deadline__range=(today, deadline)).select_related('company').order_by('deadline', 'pk')
        total = 0
        for job in jobs:
            text = f'Reminder: {job.title} at {job.company.name} closes on {job.deadline:%d %b %Y}. Apply soon.'
            total += logic.notify_job_candidates(
                job, 'deadline_reminder', text, exclude_applied=True,
            )
        self.stdout.write(self.style.SUCCESS(f'Sent {total} deadline reminder(s).'))
