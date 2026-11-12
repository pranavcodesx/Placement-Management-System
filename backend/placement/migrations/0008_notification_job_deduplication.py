import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('placement', '0007_careerresource'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='job',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='notifications',
                to='placement.job',
            ),
        ),
        migrations.AddField(
            model_name='notification',
            name='kind',
            field=models.CharField(default='general', max_length=24),
        ),
        migrations.AddConstraint(
            model_name='notification',
            constraint=models.UniqueConstraint(
                fields=('student', 'job', 'kind'),
                name='uniq_student_job_notification_kind',
            ),
        ),
    ]
