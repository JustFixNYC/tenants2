# Generated by Django 3.2.13 on 2024-01-19 23:38

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('rh', '0005_alter_rentalhistoryrequest_referral'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='rentalhistoryrequest',
            name='referral',
        ),
    ]
