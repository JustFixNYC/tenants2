import factory

from twofactor.models import TwofactorInfo
from users.tests.factories import UserFactory


class TwofactorInfoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TwofactorInfo

    user = factory.SubFactory(UserFactory)

    secret = "A" * 16

    has_user_seen_secret_yet = False
