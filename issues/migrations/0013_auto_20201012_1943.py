# Generated by Django 2.2.13 on 2020-10-12 19:43

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('issues', '0012_auto_20200330_2127'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='customissue',
            options={'ordering': ('id',)},
        ),
    ]
