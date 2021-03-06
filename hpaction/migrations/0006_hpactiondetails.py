# Generated by Django 2.1.8 on 2019-06-17 16:06

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('hpaction', '0005_auto_20190617_1500'),
    ]

    operations = [
        migrations.CreateModel(
            name='HPActionDetails',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('filed_with_311', models.NullBooleanField(help_text='Whether the user has filed any complaints with 311 before.')),
                ('thirty_days_since_311', models.NullBooleanField(help_text='Whether 30 days have passed since the user filed complaints with 311.')),
                ('hpd_issued_violations', models.NullBooleanField(help_text='Whether HPD issued any violations.')),
                ('issues_fixed', models.NullBooleanField(help_text='Whether the issues have been fixed.')),
                ('urgent_and_dangerous', models.NullBooleanField(help_text='Whether the conditions are urgent and dangerous.')),
                ('user', models.OneToOneField(help_text='The user whom the HP action is for.', on_delete=django.db.models.deletion.CASCADE, related_name='hp_action_details', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name_plural': 'HP Action Details',
            },
        ),
    ]
