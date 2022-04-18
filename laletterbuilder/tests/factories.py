import factory
from users.tests.factories import UserFactory
from loc.models import LandlordDetails
from laletterbuilder.models import HabitabilityLetter, LaIssue


class LandlordDetailsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = LandlordDetails

    user = factory.SubFactory(UserFactory)

    name = "Landlordo Calrissian"

    address = "1 Cloud City"


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


class LaIssueFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = LaIssue

    letter = factory.SubFactory(HabitabilityLetterFactory)

    @classmethod
    def _create(self, model_class, *args, **kwargs):
        issue = LaIssue(*args, **kwargs)
        issue.save()
        return issue
