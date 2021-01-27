import factory

from users.tests.factories import UserFactory
from evictionfree import models
from evictionfree.hardship_declaration import HardshipDeclarationVariables


class HardshipDeclarationDetailsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.HardshipDeclarationDetails

    user = factory.SubFactory(UserFactory)

    has_financial_hardship = True


class SubmittedHardshipDeclarationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.SubmittedHardshipDeclaration

    user = factory.SubFactory(UserFactory)

    locale = "en"

    cover_letter_html = "<p>this is a fake cover letter</p>"

    declaration_variables = HardshipDeclarationVariables(
        index_number=None,
        county_and_court=None,
        address="123 Boop Way",
        has_financial_hardship=True,
        has_health_risk=False,
        name="Boop Jones",
        date="01/27/2021",
    ).dict()
