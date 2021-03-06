# Generated by Django 2.1.5 on 2019-02-01 15:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('findhelp', '0003_auto_20190130_1317'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tenantresource',
            name='address',
            field=models.TextField(help_text="The street address of the resource's office, including borough."),
        ),
        migrations.AlterField(
            model_name='tenantresource',
            name='description',
            field=models.TextField(blank=True, help_text='The description of the tenant resource, including the services it provides.'),
        ),
        migrations.AlterField(
            model_name='tenantresource',
            name='geocoded_address',
            field=models.TextField(blank=True, help_text='This is the definitive street address returned by the geocoder, and what the geocoded point (latitude and longitude) is based from. This should not be very different from the address field (if it is, you may need to change the address so the geocoder matches to the proper location).'),
        ),
        migrations.AlterField(
            model_name='tenantresource',
            name='name',
            field=models.CharField(help_text='The name of the tenant resource.', max_length=150),
        ),
        migrations.AlterField(
            model_name='tenantresource',
            name='org_type',
            field=models.CharField(blank=True, choices=[('COMMUNITY', 'Community'), ('LEGAL', 'Legal'), ('GOVERNMENT', 'Government')], help_text='The organization type of the tenant resource.', max_length=40),
        ),
        migrations.AlterField(
            model_name='tenantresource',
            name='website',
            field=models.URLField(blank=True, help_text='The primary website of the tenant resource.'),
        ),
    ]
