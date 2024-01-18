import factory

from users.tests.factories import UserFactory
from rh.models import RentalHistoryRequest


class RentalHistoryRequestFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = RentalHistoryRequest

    user = factory.SubFactory(UserFactory)
    first_name = "Boop"
    last_name = "Jones"
    address = "123 Funky Way"
    borough = "MANHATTAN"
    address_verified = False
    referral = None
