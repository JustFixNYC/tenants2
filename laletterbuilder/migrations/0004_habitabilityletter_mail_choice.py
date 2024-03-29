# Generated by Django 3.2.12 on 2022-05-27 20:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('laletterbuilder', '0003_auto_20220420_1959'),
    ]

    operations = [
        migrations.AddField(
            model_name='habitabilityletter',
            name='mail_choice',
            field=models.TextField(choices=[('WE_WILL_MAIL', 'Mail for me'), ('USER_WILL_MAIL', 'Send myself')], default='WE_WILL_MAIL', help_text='How the letter will be mailed.', max_length=30),
        ),
    ]
