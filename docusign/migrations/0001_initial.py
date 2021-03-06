# Generated by Django 2.2.10 on 2020-03-24 12:52

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Config',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('private_key', models.TextField(blank=True)),
                ('consent_code', models.TextField(blank=True)),
                ('consent_code_updated_at', models.DateTimeField(blank=True, null=True)),
                ('base_uri', models.URLField(blank=True)),
            ],
        ),
    ]
