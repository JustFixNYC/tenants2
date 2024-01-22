# Generated by Django 3.2.13 on 2024-01-19 23:47

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('partnerships', '0001_initial'),
        ('rh', '0006_remove_rentalhistoryrequest_referral'),
    ]

    operations = [
        migrations.AddField(
            model_name='rentalhistoryrequest',
            name='referral',
            field=models.ForeignKey(blank=True, db_column='referral', null=True, on_delete=django.db.models.deletion.DO_NOTHING, to='partnerships.partnerorg', to_field='name'),
        ),
    ]
