# Generated by Django 2.2.10 on 2020-04-02 14:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('hpaction', '0017_feewaiverdetails_income_src_social_security'),
    ]

    operations = [
        migrations.AddField(
            model_name='hpactiondocuments',
            name='kind',
            field=models.CharField(choices=[('NORMAL', 'Normal HP Action'), ('EMERGENCY', 'Emergency HP Action (COVID-19)')], default='NORMAL', max_length=30),
        ),
        migrations.AddField(
            model_name='uploadtoken',
            name='kind',
            field=models.CharField(choices=[('NORMAL', 'Normal HP Action'), ('EMERGENCY', 'Emergency HP Action (COVID-19)')], default='NORMAL', max_length=30),
        ),
    ]
