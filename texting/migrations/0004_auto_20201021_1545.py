# Generated by Django 2.2.13 on 2020-10-21 15:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('texting', '0003_auto_20191126_1102'),
    ]

    operations = [
        migrations.AlterField(
            model_name='reminder',
            name='kind',
            field=models.TextField(choices=[('LOC', 'Letter of complaint reminder'), ('NORENT_CA_2020_11', 'NoRent California reminder - November 2020'), ('NORENT_CA_2020_12', 'NoRent California reminder - December 2020'), ('NORENT_CA_2021_01', 'NoRent California reminder - January 2020')], help_text='The type of reminder sent.', max_length=30),
        ),
    ]