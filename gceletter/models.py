import hashlib
from typing import List
from django.db import models

# from typing import List
# from django.contrib.postgres.fields import ArrayField

from loc.models import LOC_MAILING_CHOICES, BaseLetterRequest
from project.util.address_form_fields import BOROUGH_FIELD_KWARGS
from project.util import phone_number as pn
from project.util.instance_change_tracker import InstanceChangeTracker
from project.util.mailing_address import MailingAddress
from project.util.site_util import absolute_reverse


class GCELetter(BaseLetterRequest):
    # Inherited LOC-specific field we don't need
    rejection_reason = None

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    # cc_emails: List[str] = ArrayField(models.EmailField(max_length=20), blank=True, default=list,help_text="List of additional emails to include when email the letter to the user.")

    hash: str = models.CharField(max_length=64, unique=True, null=True, blank=True)

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.__tracker = InstanceChangeTracker(self, ["mail_choice", "html_content"])
        self.__tracking_number_tracker = InstanceChangeTracker(self, ["tracking_number"])

    def _on_tracking_number_changed(self):
        if not self.tracking_number:
            return
        # self.user.chain_sms_async(
        #     [
        #         (
        #             f"We mailed your Letter of Complaint to your landlord. "
        #             f"Track your letter: {self.usps_tracking_url} "
        #         ),
        #         f"Link may take a few days to update. ",
        #     ]
        # )

        # self.user.trigger_followup_campaign_async("LOC")

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        orig_data = str(self.pk).encode("utf-8")
        self.hash = hashlib.sha256(orig_data).hexdigest()
        super().save(update_fields=["hash"])

        self.__tracker.set_to_unchanged()

        if self.__tracking_number_tracker.has_changed():
            self._on_tracking_number_changed()

        self.__tracking_number_tracker.set_to_unchanged()

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


class UserDetails(MailingAddress):
    """
    This represents the user's details for a GCE letter.
    """

    letter = models.OneToOneField(
        GCELetter,
        on_delete=models.CASCADE,
        related_name="user_details",
        help_text="The GCE letter this user is sending to their landlord.",
    )

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

    urbanization = models.CharField(
        max_length=80,
        null=True,
        blank=True,
        help_text="Optional. Only used for addresses in Puerto Rico.",
    )

    @property
    def full_name(self) -> str:
        """
        The user's full name (first/given and last/family).
        """

        return f"{self.first_name} {self.last_name}"


class LandlordDetails(MailingAddress):
    """
    This represents the landlord details for a user's GCE letter.
    """

    letter = models.OneToOneField(
        GCELetter,
        on_delete=models.CASCADE,
        related_name="landlord_details",
        help_text="The GCE letter being sent to this landlord.",
    )

    name = models.CharField(blank=True, max_length=100, help_text="The landlord's name.")

    email = models.EmailField(
        blank=True,
        help_text="The landlord's email address.",
    )

    is_looked_up = models.BooleanField(
        default=False,
        help_text=(
            "Whether the name and address was looked up automatically, "
            "or manually entered by the user."
        ),
    )

    urbanization = models.CharField(
        max_length=80,
        null=True,
        blank=True,
        help_text="Optional. Only used for addresses in Puerto Rico.",
    )
