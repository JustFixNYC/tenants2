import factory
from users.tests.factories import UserFactory
from loc.models import LandlordDetails
from lettersender.models import LetterSenderLetter, LetterSenderIssue


class LandlordDetailsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = LandlordDetails

    user = factory.SubFactory(UserFactory)

    name = "Landlordo Calrissian"

    address = "1 Cloud City"


class LetterSenderLetterFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = LetterSenderLetter

    user = factory.SubFactory(UserFactory)

    html_content = "<p>hi i am a letter sender letter</p>"

    @classmethod
    def _create(self, model_class, *args, **kwargs):
        letter = LetterSenderLetter(*args, **kwargs)
        letter.save()
        return letter


class LetterSenderIssueFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = LetterSenderIssue

    letter = factory.SubFactory(LetterSenderLetterFactory)

    @classmethod
    def _create(self, model_class, *args, **kwargs):
        issue = LetterSenderIssue(*args, **kwargs)
        issue.save()
        return issue
