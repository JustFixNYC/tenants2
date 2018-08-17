from django.contrib.auth.models import User
import factory.django

from ..models import LegacyUserInfo
from .. import mongo
from . import example_legacy_data


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = 'boop'


class LegacyUserInfoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = LegacyUserInfo

    user = factory.SubFactory(UserFactory)

    role = LegacyUserInfo.TENANT

    phone_number = '1234567890'


def MongoTenantFactory(**kwargs):
    return mongo.MongoTenant(**{**example_legacy_data.TENANT, **kwargs})


def MongoIdentityFactory(**kwargs):
    return mongo.MongoIdentity(**{**example_legacy_data.IDENTITY, **kwargs})


def MongoAdvocateFactory(**kwargs):
    return mongo.MongoAdvocate(**{**example_legacy_data.ADVOCATE, **kwargs})
