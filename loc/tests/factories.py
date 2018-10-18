import factory

from users.tests.factories import UserFactory
from loc.models import LetterRequest, LOC_MAILING_CHOICES, LandlordDetails


class LetterRequestFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = LetterRequest

    user = factory.SubFactory(UserFactory)

    mail_choice = LOC_MAILING_CHOICES.WE_WILL_MAIL


class LandlordDetailsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = LandlordDetails

    user = factory.SubFactory(UserFactory)

    name = 'Landlordo Calrissian'

    address = '1 Cloud City'
