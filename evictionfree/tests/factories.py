import factory


from users.tests.factories import UserFactory
from evictionfree import models


class HardshipDeclarationDetailsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.HardshipDeclarationDetails

    user = factory.SubFactory(UserFactory)
