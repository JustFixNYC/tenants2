# Generated by Django 2.2.4 on 2019-11-13 13:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('loc', '0013_auto_20190605_2122'),
    ]

    operations = [
        migrations.AddField(
            model_name='letterrequest',
            name='tracking_number',
            field=models.CharField(blank=True, help_text='The tracking number for the letter. Note that when this is changed, the user will be notified via SMS and added to a LOC follow-up campaign, if one has been configured.', max_length=100),
        ),
    ]
