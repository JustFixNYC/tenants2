# Generated by Django 2.2.9 on 2020-02-12 15:07

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('loc', '0016_letterrequest_rejection_reason'),
    ]

    operations = [
        migrations.AlterField(
            model_name='letterrequest',
            name='rejection_reason',
            field=models.CharField(blank=True, choices=[('INCRIMINATION', 'Letter is potentially incriminating'), ('CHANGED_MIND', 'Tenant changed their mind'), ('BAD_ADDRESS', 'Unintelligible address'), ('OTHER', 'Other')], help_text="The reason we didn't mail the letter, if applicable.", max_length=100),
        ),
    ]
