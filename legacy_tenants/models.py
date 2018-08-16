from django.db import models
from django.contrib.auth.models import User

# https://stackoverflow.com/a/25418489
MONGODB_ID_LEN = 24

PHONE_NUMBER_LEN = 10


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
        User,
        on_delete=models.CASCADE,
        related_name='legacy_info'
    )

    role = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES
    )

    mongo_id = models.CharField(
        max_length=MONGODB_ID_LEN,
        unique=True
    )

    phone_number = models.CharField(
        max_length=PHONE_NUMBER_LEN,
        unique=True
    )

    @classmethod
    def is_legacy_user(cls, user: User) -> bool:
        return hasattr(user, 'legacy_info')
