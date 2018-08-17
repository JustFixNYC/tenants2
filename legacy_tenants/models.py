from django.db import models
from django.contrib.auth.models import User

from users.models import JustfixUser, PHONE_NUMBER_LEN
from . import mongo


# https://stackoverflow.com/a/25418489
MONGODB_ID_LEN = 24


class LegacyUserInfo(models.Model):
    '''
    A model that associates a user with their legacy tenant
    app details, if they exist.
    '''

    TENANT = "TENANT"
    ADVOCATE = "ADVOCATE"

    ROLE_CHOICES = [
        (TENANT, "Tenant"),
        (ADVOCATE, "Advocate"),
    ]

    user = models.OneToOneField(
        JustfixUser,
        on_delete=models.CASCADE,
        related_name='legacy_info'
    )

    role = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES
    )

    phone_number = models.CharField(
        max_length=PHONE_NUMBER_LEN,
        unique=True
    )

    @classmethod
    def is_legacy_user(cls, user: User) -> bool:
        return hasattr(user, 'legacy_info')

    def update_from_mongo_user(self, mongo_user: mongo.MongoUser):
        if mongo_user.tenant_info:
            self.role = self.TENANT
        elif mongo_user.advocate_info:
            self.role = self.ADVOCATE
        else:
            raise ValueError('mongo user is neither tenant nor advocate')
        self.phone_number = mongo_user.identity.phone
