from django.db import models

from users.models import JustfixUser
from project.util import phone_number as pn
from project.util.address_form_fields import ADDRESS_FIELD_KWARGS, BOROUGH_FIELD_KWARGS


class RentalHistoryRequest(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=150)
    apartment_number = models.CharField(max_length=15)
    phone_number = models.CharField(**pn.get_model_field_kwargs())
    address = models.CharField(**ADDRESS_FIELD_KWARGS)
    address_verified = models.BooleanField()
    borough = models.CharField(**BOROUGH_FIELD_KWARGS)
    zipcode = models.CharField(max_length=5, blank=True)
    referral = models.CharField(max_length=30, blank=True)
    user = models.ForeignKey(
        JustfixUser,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        help_text=(
            "User who was logged in when the rent history request was made. "
            "This may or may not be different from the actual name/address of the "
            "request, e.g. if the user is making a request on someone else's "
            "behalf."
        ),
    )

    def set_user(self, user: JustfixUser):
        self.user = user if user.is_authenticated else None
