import factory
import datetime

from norent.models import Letter, RentPeriod
from users.tests.factories import UserFactory


class RentPeriodFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = RentPeriod

    payment_date = datetime.date(2020, 5, 1)


class LetterFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Letter

    user = factory.SubFactory(UserFactory)

    rent_period = factory.SubFactory(RentPeriodFactory)

    html_content = "<p>hi i am a no rent letter</p>"
