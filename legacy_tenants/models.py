from django.db import models
from django.contrib.auth.models import User

from users.models import JustfixUser
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

    prefers_legacy_app = models.BooleanField(
        default=True,
        help_text=(
            "Whether we should redirect this user to the legacy "
            "tenant app after they log in."
        )
    )

    @classmethod
    def is_legacy_user(cls, user: User) -> bool:
        return hasattr(user, 'legacy_info')

    @classmethod
    def does_user_prefer_legacy_app(cls, user: User) -> bool:
        if cls.is_legacy_user(user):
            return user.legacy_info.prefers_legacy_app
        return False

    def update_from_mongo_user(self, mongo_user: mongo.MongoUser):
        if mongo_user.tenant_info:
            self.role = self.TENANT
            self.user.first_name = mongo_user.tenant_info.firstName
            self.user.last_name = mongo_user.tenant_info.lastName
        elif mongo_user.advocate_info:
            self.role = self.ADVOCATE
            self.user.first_name = mongo_user.advocate_info.firstName
            self.user.last_name = mongo_user.advocate_info.lastName
        else:
            raise ValueError('mongo user is neither tenant nor advocate')
