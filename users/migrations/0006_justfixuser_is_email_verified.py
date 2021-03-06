# Generated by Django 2.2.10 on 2020-03-24 17:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_auto_20181205_1211'),
    ]

    operations = [
        migrations.AddField(
            model_name='justfixuser',
            name='is_email_verified',
            field=models.BooleanField(default=False, help_text="Whether the user has verified that they 'own' their email address by clicking on a link we emailed them."),
        ),
    ]
