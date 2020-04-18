import factory

from users.tests.factories import UserFactory
from norent.models import NationalOnboardingInfo


class NationalOnboardingInfoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = NationalOnboardingInfo

    user = factory.SubFactory(UserFactory)

    address = '620 GUERRERO ST'

    apt_number = '8'

    city = 'SAN FRANCISCO'

    state = 'CA'

    zip_code = '94110'
