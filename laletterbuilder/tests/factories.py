import factory
from users.tests.factories import UserFactory
from loc.models import LandlordDetails


class LandlordDetailsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = LandlordDetails

    user = factory.SubFactory(UserFactory)

    name = "Landlordo Calrissian"

    address = "1 Cloud City"


class LandlordDetailsFactory(LandlordDetailsFactory):
    address = "123 Cloud City Drive\nBespin, NY 12345"
    primary_line = "123 Cloud City Drive"
    city = "Bespin"
    state = "NY"
    zip_code = "12345"
    email = "boop@boop.com"
