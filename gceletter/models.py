import hashlib
import logging
from django.db import models

from project.common_data import Choices
from project.util import phone_number as pn
from project.util.lob_models_util import LocalizedHTMLLetter
from project.util.mailing_address import MailingAddress
from project.util.site_util import absolute_reverse

GCELETTER_MAILING_CHOICES = Choices.from_file("gceletter-mailing-choices.json")


class GCELetter(LocalizedHTMLLetter):
    """
    A Good Cause Eviction letter that is automatically sent at the same time it's created.
    """

    class Meta:
        ordering = ["-created_at"]

    # Default campaign for confirmation
    RAPIDPRO_CAMPAIGN = "GCE_LETTER"

    # Type hints for 1:1 relationships
    user_details: "UserDetails"
    landlord_details: "LandlordDetails"

    mail_choice = models.TextField(
        max_length=30,
        choices=GCELETTER_MAILING_CHOICES.choices,
        help_text="How the letter will be mailed.",
        default=GCELETTER_MAILING_CHOICES.WE_WILL_MAIL,
    )

    email_to_landlord = models.BooleanField(
        null=True,
        blank=True,
        help_text=(
            "Whether to email a copy of the letter to the landlord. "
            "Requires a landlord email to be provided"
        ),
    )

    pdf_base64 = models.TextField(
        help_text="A base64 encoded string representing the English content of the letter.",
        blank=True,
    )

    # TODO: Decide if this quick experiment with creating unique urls for pdf
    # with hash makes sense as an alternative to full account for accessing past
    # letters, and sort out how it would work if there are multiple letters
    hash: str = models.CharField(max_length=64, unique=True, null=True, blank=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        orig_data = str(self.pk).encode("utf-8")
        self.hash = hashlib.sha256(orig_data).hexdigest()
        super().save(update_fields=["hash"])

    @property
    def will_we_mail(self) -> bool:
        """
        Whether or not the user wants us to mail the letter for them.
        """

        return self.mail_choice == GCELETTER_MAILING_CHOICES.WE_WILL_MAIL

    # TODO: add @property for admin_pdf_url and admin_url so they can be linked
    # in slack messages logging new letters in case we need to manually check
    # them on the admin dashboard.

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
        return absolute_reverse("gceletter:gce_letter_pdf", kwargs={"hash": self.hash})

    @property
    def admin_url(self):
        return absolute_reverse("admin:gceletter_gceletter_change", args=[self.pk])

    # TODO: Add method for adding user to textit followup campaign, see GCE

    def __str__(self):
        return f"{self.user_details.full_name}'s GCE Letter ({self.created_at.date()})"

    def trigger_followup_campaign_async(self) -> None:
        ud = self.user_details
        if not ud.phone_number:
            return

        from rapidpro import followup_campaigns as fc

        custom_fields = {}
        campaign = self.RAPIDPRO_CAMPAIGN

        if self.tracking_number:
            custom_fields["gce_letter_tracking_number"] = self.tracking_number

        fc.ensure_followup_campaign_exists(campaign)

        logging.info(f"Triggering rapidpro campaign '{campaign}' on user " f"{self.pk}.")

        fc.trigger_followup_campaign_async(
            ud.full_name,
            ud.phone_number,
            campaign,
            locale=self.locale,
            custom_fields=custom_fields,
        )


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

    # TODO: Decide if we want to add a "preferred name" field like with LOC
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

    # NOTE: secondary_line & urbanization are already in the inherited class, but are
    # missing the "null=True" option despite the help text stating that they are
    # optional. I'm hesitant to change the model that LOC/LATAC use, so for now
    # just redefining in the user and landlord models here
    secondary_line = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        help_text='Optional. Usually the second line of the address, e.g. "Suite 2"',
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

    def __str__(self):
        return f"{self.full_name} / {self.phone_number}"


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
        null=True,
        help_text="The landlord's email address.",
    )

    is_looked_up = models.BooleanField(
        default=False,
        help_text=(
            "Whether the name and address was looked up automatically, "
            "or manually entered by the user."
        ),
    )

    secondary_line = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        help_text='Optional. Usually the second line of the address, e.g. "Suite 2"',
    )

    urbanization = models.CharField(
        max_length=80,
        null=True,
        blank=True,
        help_text="Optional. Only used for addresses in Puerto Rico.",
    )

    def __str__(self):
        return f"{self.name}: {'/'.join(self.address_lines_for_mailing)}"
