# Generated by Django 2.2.10 on 2020-05-08 20:03

from django.conf import settings
import django.contrib.postgres.fields.jsonb
from django.db import migrations, models
import django.db.models.deletion
import project.util.mailing_address


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('hpaction', '0021_auto_20200502_1221'),
    ]

    operations = [
        migrations.CreateModel(
            name='ServingPapers',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('primary_line', models.CharField(blank=True, help_text='Usually the first line of the address, e.g. "150 Court Street"', max_length=255)),
                ('secondary_line', models.CharField(blank=True, help_text='Optional. Usually the second line of the address, e.g. "Suite 2"', max_length=255)),
                ('urbanization', models.CharField(blank=True, help_text='Optional. Only used for addresses in Puerto Rico.', max_length=80)),
                ('city', models.CharField(blank=True, help_text='The city of the address, e.g. "Brooklyn".', max_length=80)),
                ('state', models.CharField(blank=True, choices=[('AK', 'Alaska'), ('AL', 'Alabama'), ('AS', 'American Samoa'), ('AZ', 'Arizona'), ('AR', 'Arkansas'), ('CA', 'California'), ('CO', 'Colorado'), ('CT', 'Connecticut'), ('DE', 'Delaware'), ('DC', 'District of Columbia'), ('FL', 'Florida'), ('GA', 'Georgia'), ('GU', 'Guam'), ('HI', 'Hawaii'), ('ID', 'Idaho'), ('IL', 'Illinois'), ('IN', 'Indiana'), ('IA', 'Iowa'), ('KS', 'Kansas'), ('KY', 'Kentucky'), ('LA', 'Louisiana'), ('ME', 'Maine'), ('MD', 'Maryland'), ('MA', 'Massachusetts'), ('MI', 'Michigan'), ('MN', 'Minnesota'), ('MP', 'Northern Mariana Islands'), ('MS', 'Mississippi'), ('MO', 'Missouri'), ('MT', 'Montana'), ('NE', 'Nebraska'), ('NV', 'Nevada'), ('NH', 'New Hampshire'), ('NJ', 'New Jersey'), ('NM', 'New Mexico'), ('NY', 'New York'), ('NC', 'North Carolina'), ('ND', 'North Dakota'), ('OH', 'Ohio'), ('OK', 'Oklahoma'), ('OR', 'Oregon'), ('PA', 'Pennsylvania'), ('PR', 'Puerto Rico'), ('RI', 'Rhode Island'), ('SC', 'South Carolina'), ('SD', 'South Dakota'), ('TN', 'Tennessee'), ('TX', 'Texas'), ('UT', 'Utah'), ('VT', 'Vermont'), ('VA', 'Virginia'), ('VI', 'Virgin Islands'), ('WA', 'Washington'), ('WV', 'West Virginia'), ('WI', 'Wisconsin'), ('WY', 'Wyoming')], help_text='The two-letter state or territory for the address, e.g. "NY".', max_length=2)),
                ('zip_code', models.CharField(blank=True, help_text='The zip code of the address, e.g. "11201" or "94107-2282".', max_length=10, validators=[project.util.mailing_address.ZipCodeValidator()])),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('name', models.CharField(help_text='The name of the person/company being served.', max_length=40)),
                ('pdf_file', models.FileField(help_text='The PDF file representing the papers to be served.', upload_to='hp-action-serving-papers/')),
                ('lob_letter_object', django.contrib.postgres.fields.jsonb.JSONField(blank=True, help_text='If the papers were sent via Lob, this is the JSON response of the API call that was made to send them, documented at https://lob.com/docs/python#letters.', null=True)),
                ('tracking_number', models.CharField(blank=True, help_text='The tracking number for the papers.', max_length=100)),
                ('letter_sent_at', models.DateTimeField(blank=True, help_text='When the papers were mailed through the postal service.', null=True)),
                ('sender', models.ForeignKey(blank=True, help_text='The person serving the documents.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='serving_papers_sent', to=settings.AUTH_USER_MODEL)),
                ('uploaded_by', models.ForeignKey(blank=True, help_text='The user who uploaded the papers.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='serving_papers_uploaded', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
