from django.contrib.auth.models import User
import factory.django

from ..models import (
    LegacyUserInfo
)


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = 'boop'


class LegacyUserInfoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = LegacyUserInfo

    user = factory.SubFactory(UserFactory)

    role = LegacyUserInfo.TENANT

    mongo_id = '507f1f77bcf86cd799439011'

    phone_number = '1234567890'
