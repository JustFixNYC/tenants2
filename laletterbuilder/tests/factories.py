import factory
from users.tests.factories import UserFactory
from loc.models import LandlordDetails
from models import HabitabilityLetter


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


class HabitabilityLetterFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = HabitabilityLetter

    user = factory.SubFactory(UserFactory)

    html_content = "<p>hi i am a habitability letter</p>"

    @classmethod
    def _create(self, model_class, *args, **kwargs):
        letter = HabitabilityLetter(*args, **kwargs)
        letter.save()
        return letter
