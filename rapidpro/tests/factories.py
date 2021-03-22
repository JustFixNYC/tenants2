import factory
from django.utils.timezone import now

from users.tests.factories import UserFactory
from ..models import ContactGroup, UserContactGroup


class ContactGroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ContactGroup

    uuid = "uuid1"

    name = "Funky Group"


class UserContactGroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = UserContactGroup

    user = factory.SubFactory(UserFactory)

    group = factory.SubFactory(ContactGroupFactory)

    earliest_known_date = now()
