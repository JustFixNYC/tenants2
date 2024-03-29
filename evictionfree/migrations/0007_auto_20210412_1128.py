# Generated by Django 3.2 on 2021-04-12 11:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('evictionfree', '0006_hardshipdeclarationdetails_court_name'),
    ]

    operations = [
        migrations.AlterField(
            model_name='submittedhardshipdeclaration',
            name='cover_letter_variables',
            field=models.JSONField(help_text='The variables used to fill out the cover letter page.'),
        ),
        migrations.AlterField(
            model_name='submittedhardshipdeclaration',
            name='declaration_variables',
            field=models.JSONField(help_text='The variables used to fill out the declaration form PDF.'),
        ),
        migrations.AlterField(
            model_name='submittedhardshipdeclaration',
            name='lob_letter_object',
            field=models.JSONField(blank=True, help_text='If the declaration was sent via Lob, this is the JSON response of the API call that was made to send the letter, documented at https://lob.com/docs/python#letters.', null=True),
        ),
    ]
