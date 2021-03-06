# Generated by Django 2.2.10 on 2020-05-02 16:57

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import users.models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_justfixuser_is_email_verified'),
        ('norent', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='NorentUser',
            fields=[
            ],
            options={
                'verbose_name': 'User with NoRent letter',
                'verbose_name_plural': 'Users with NoRent letters',
                'proxy': True,
                'indexes': [],
                'constraints': [],
            },
            bases=('users.justfixuser',),
            managers=[
                ('objects', users.models.JustfixUserManager()),
            ],
        ),
        migrations.AlterField(
            model_name='letter',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='norent_letters', to=settings.AUTH_USER_MODEL),
        ),
    ]
