# Generated by Django 3.2.13 on 2024-10-23 21:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('onboarding', '0030_onboardinginfo_agreed_to_lalatterbuilder_terms_squashed_0031_rename_agreed_to_lalatterbuilder_terms_onboardinginfo_agreed_to_laletterbuilder_terms'),
    ]

    operations = [
        migrations.AlterField(
            model_name='onboardinginfo',
            name='lease_type',
            field=models.CharField(blank=True, choices=[('RENT_STABILIZED', 'Rent Stabilized'), ('RENT_CONTROLLED', 'Rent Controlled'), ('OTHER_AFFORDABLE', 'Affordable housing (other than rent-stabilized)'), ('MARKET_RATE', 'Market Rate'), ('NYCHA', 'NYCHA/Public Housing (includes RAD/PACT)'), ('NOT_SURE', "I'm not sure"), ('NO_LEASE', "I don't have a lease"), ('RENT_STABILIZED_OR_CONTROLLED', 'Either Rent Stabilized or Rent Controlled (legacy option)')], help_text='The type of housing the user lives in (NYC only).', max_length=30),
        ),
        migrations.AlterField(
            model_name='onboardinginfo',
            name='signup_intent',
            field=models.CharField(choices=[('LOC', 'Letter of Complaint'), ('HP', 'HP Action'), ('EHP', 'Emergency HP Action'), ('NORENT', 'No rent letter'), ('EVICTIONFREE', 'Eviction free'), ('LALETTERBUILDER', 'LA Tenant Action Center')], help_text='The reason the user originally signed up with us.', max_length=30),
        ),
    ]