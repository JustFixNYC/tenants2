# Generated by Django 3.2.13 on 2024-12-12 03:11

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('loc', '0027_auto_20210412_1128'),
    ]

    operations = [
        migrations.AlterField(
            model_name='archivedletterrequest',
            name='mail_choice',
            field=models.TextField(choices=[('WE_WILL_MAIL', 'Yes, have JustFix mail this letter for me.'), ('USER_WILL_MAIL', "No thanks, I'll mail it myself.")], help_text='How the letter of complaint will be mailed.', max_length=30),
        ),
        migrations.AlterField(
            model_name='letterrequest',
            name='mail_choice',
            field=models.TextField(choices=[('WE_WILL_MAIL', 'Yes, have JustFix mail this letter for me.'), ('USER_WILL_MAIL', "No thanks, I'll mail it myself.")], help_text='How the letter of complaint will be mailed.', max_length=30),
        ),
        migrations.CreateModel(
            name='WorkOrder',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ticket_number', models.CharField(blank=True, help_text='NYCHA work order ticket number', max_length=10)),
                ('user', models.ForeignKey(help_text='The user whose dwelling this access date this is for.', on_delete=django.db.models.deletion.CASCADE, related_name='work_order', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
