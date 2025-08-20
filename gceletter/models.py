from django.db import models

# from typing import List
# from django.contrib.postgres.fields import ArrayField

from loc.models import LOC_MAILING_CHOICES, BaseLetterRequest
from project.util.address_form_fields import BOROUGH_FIELD_KWARGS
from project.util import phone_number as pn
from project.util.instance_change_tracker import InstanceChangeTracker
from project.util.site_util import absolute_reverse


class GCELetter(BaseLetterRequest):
    # Inherited LOC-specific field we don't need
    rejection_reason = None

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    first_name: str = models.CharField(
        max_length=100, blank=True, help_text="The user's first/given name."
    )

    last_name: str = models.CharField(
        max_length=100, blank=True, help_text="The user's last/family name."
    )

    phone_number: str = models.CharField(blank=True, **pn.get_model_field_kwargs())

    email: str = models.EmailField(help_text="The user's email address.")

    bbl: str = models.CharField(
        max_length=10,  # One for the borough, 5 for the block, 4 for the lot.
        help_text=(
            "The zero-padded borough, block and lot (BBL) number for the "
            "user's home address property."
        ),
        blank=True,
    )

    house_number: str = models.TextField(
        blank=True, help_text="The user's home address house number."
    )

    street_name: str = models.TextField(
        blank=True, help_text="The user's home address street name."
    )

    apt_no: str = models.TextField(
        blank=True, help_text="The user's home address apartment number (address line 2)."
    )

    borough: str = models.CharField(
        blank=True, **BOROUGH_FIELD_KWARGS, help_text="The user's home address borough."
    )

    zipcode: str = models.CharField(
        max_length=5, blank=True, help_text="The user's home address zipcode."
    )

    ll_full_name: str = models.CharField(
        max_length=100, blank=True, help_text="The user's landlord's full name."
    )

    ll_email: str = models.EmailField(help_text="The user's email address.")

    ll_house_number: str = models.TextField(
        blank=True, help_text="The user's landlord's address house number."
    )

    ll_street_name: str = models.TextField(
        blank=True, help_text="The user's landlord's address street name."
    )

    ll_apt_no: str = models.TextField(
        blank=True, help_text="The user's landlord's address apartment number (address line 2)."
    )

    ll_borough: str = models.CharField(
        blank=True, **BOROUGH_FIELD_KWARGS, help_text="The user's landlord's address borough."
    )

    ll_zipcode: str = models.CharField(
        max_length=5, blank=True, help_text="The user's landlord's address zipcode."
    )

    # cc_emails: List[str] = ArrayField(models.EmailField(max_length=20), blank=True, default=list,help_text="List of additional emails to include when email the letter to the user.")

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.__tracker = InstanceChangeTracker(self, ["mail_choice", "html_content"])
        self.__tracking_number_tracker = InstanceChangeTracker(self, ["tracking_number"])

    @property
    def will_we_mail(self) -> bool:
        """
        Whether or not the user wants us to mail the letter for them.
        """

        return self.mail_choice == LOC_MAILING_CHOICES.WE_WILL_MAIL

    @property
    def admin_pdf_url(self) -> str:
        """
        A link where an administrative/staff user can view the
        letter of complaint as a PDF.

        If we don't have enough information to generate such a link,
        this will be an empty string.
        """

        if self.pk is None:
            return ""
        return absolute_reverse("loc_for_user", kwargs={"user_id": self.user.pk})

    # See loc/admin_views.py for LOB processes, can add methods here and call
    # from ./views.py upon letter request. We might also want to consider adding
    # a separate endpoint just for the address verification via lob so we can
    # check the deliverability of landlord address immediately on that step so
    # they can correct if necessary before proceeding.

    # See loc/email_letter.py for emailing letter to user and landlord

    # See gce/models.py for adding user to textit followup campaign
