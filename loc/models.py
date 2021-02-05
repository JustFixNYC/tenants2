from typing import List, Optional, Dict
import datetime
from django.db import models, transaction
from django.db.models import Q
from django.utils import timezone
from django.utils.html import format_html
from django.core.exceptions import ValidationError
from django.contrib.postgres.fields import JSONField
from django.conf import settings

from project.common_data import Choices
from project import common_data
from project.util import phone_number as pn
from project.util.mailing_address import MailingAddress
from project.util.site_util import absolute_reverse, get_site_name
from project.util.instance_change_tracker import InstanceChangeTracker
from users.models import JustfixUser
from .landlord_lookup import lookup_landlord


LOB_STRICTNESS_HELP_URL = (
    "https://lob.com/resources/guides/general/verification-of-mailing-addresses"
)

LOC_MAILING_CHOICES = Choices.from_file("loc-mailing-choices.json")

LOC_REJECTION_CHOICES = Choices.from_file("loc-rejection-choices.json")

USPS_TRACKING_URL_PREFIX = common_data.load_json("loc.json")["USPS_TRACKING_URL_PREFIX"]

# The amount of time a user has to change their letter of request
# content after originally submitting it.
LOC_CHANGE_LEEWAY = datetime.timedelta(hours=1)

# Maximum length of a landlord address.
ADDR_LENGTH = 1000

# Query on the user model to filter only the users who need their LOCs mailed.
USER_MAILING_NEEDED_Q = (
    Q(letter_request__mail_choice=LOC_MAILING_CHOICES.WE_WILL_MAIL)
    & Q(letter_request__tracking_number__exact="")
    & Q(letter_request__rejection_reason__exact="")
)


class AccessDateManager(models.Manager):
    @transaction.atomic
    def set_for_user(self, user: JustfixUser, dates: List[datetime.date]):
        self.filter(user=user).delete()
        self.bulk_create([AccessDate(user=user, date=date) for date in dates])

    def get_for_user(self, user: JustfixUser) -> List[datetime.date]:
        return [ad.date for ad in user.access_dates.all()]


class AccessDate(models.Model):
    class Meta:
        unique_together = ("user", "date")

    user = models.ForeignKey(
        JustfixUser,
        on_delete=models.CASCADE,
        related_name="access_dates",
        help_text="The user whose dwelling this access date this is for.",
    )

    date = models.DateField(help_text="The date on which the user's dwelling will be accessible.")

    objects = AccessDateManager()


class LandlordDetails(MailingAddress):
    """
    This represents the landlord details for a user's address, either
    manually entered by them or automatically looked up by us (or a
    combination of the two, if the user decided to change what we
    looked up).
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__address_tracker = InstanceChangeTracker(self, self.MAILING_ADDRESS_ATTRS)

    user = models.OneToOneField(
        JustfixUser,
        on_delete=models.CASCADE,
        related_name="landlord_details",
        help_text="The user whose landlord details this is for.",
    )

    name = models.CharField(blank=True, max_length=100, help_text="The landlord's name.")

    address = models.CharField(
        blank=True,
        max_length=ADDR_LENGTH,
        verbose_name="LEGACY address",
        help_text=(
            "The full mailing address for the landlord. This is a LEGACY "
            "field that we prefer not to use if possible, e.g. if the "
            "more granular primary/secondary line and city/state/zip "
            "details are available on this model."
        ),
    )

    lookup_date = models.DateField(
        null=True, blank=True, help_text="When we last tried to look up the landlord's details."
    )

    email = models.EmailField(
        blank=True,
        help_text="The landlord's email address.",
    )

    phone_number = models.CharField(
        blank=True,
        **pn.get_model_field_kwargs(),
    )

    is_looked_up = models.BooleanField(
        default=False,
        help_text=(
            "Whether the name and address was looked up automatically, "
            "or manually entered by the user."
        ),
    )

    def formatted_phone_number(self) -> str:
        return pn.humanize(self.phone_number)

    def get_or_create_address_details_model(self) -> "AddressDetails":
        return AddressDetails.objects.get_or_create(
            address=self.address,
            defaults=self.get_address_as_dict(),
        )[0]

    @property
    def address_lines_for_mailing(self) -> List[str]:
        """
        Return the full mailing address as a list of lines, preferring
        the new granular address information over the legacy "blobby"
        address information.
        """

        value = super().address_lines_for_mailing
        if value:
            return value
        if not self.address:
            return []
        return self.address.split("\n")

    def clear_address(self):
        super().clear_address()
        self.address = ""
        self.is_looked_up = False

    @classmethod
    def _get_or_create_for_user(cls, user: JustfixUser) -> "LandlordDetails":
        if hasattr(user, "landlord_details"):
            return user.landlord_details
        return LandlordDetails(user=user)

    @classmethod
    def create_or_update_lookup_for_user(
        cls, user: JustfixUser, save: bool = True
    ) -> Optional["LandlordDetails"]:
        """
        Create or update an instance of this class associated with the user by
        attempting to look up details on the given user's address.

        If the lookup fails, this method will still set the lookup date, so that
        another lookup can be attempted later.

        However, if the user doesn't have any address information, this will return
        None, as it has no address to lookup the landlord for.
        """

        if hasattr(user, "onboarding_info") and user.onboarding_info.borough:
            oi = user.onboarding_info
            info = lookup_landlord(oi.full_nyc_address, oi.pad_bbl, oi.pad_bin)
            details = cls._get_or_create_for_user(user)
            details.lookup_date = timezone.now()
            if info:
                details.name = info.name
                details.address = info.address
                details.primary_line = info.primary_line
                details.city = info.city
                details.state = info.state
                details.zip_code = info.zip_code
                details.is_looked_up = True
            if save:
                details.save()
            return details
        return None

    def save(self, *args, **kwargs):
        if self.__address_tracker.has_changed():
            # Update the legacy address field.
            self.address = "\n".join(self.address_lines_for_mailing)
            self.__address_tracker.set_to_unchanged()
        return super().save(*args, **kwargs)


class AddressDetails(MailingAddress):
    """
    A model that maps address "blobs" of text to individual fields that
    represent the address.

    Note that this model isn't as useful as it used to be, since the address
    blobs are now LEGACY and we try to store the individual fields
    directly. However, it can still be useful for the purpose of being able
    to manually override Lob (though this functionality too may eventually
    be subsumed into the `LandlordDetails` model).
    """

    class Meta:
        verbose_name_plural = "Address details"

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    address = models.CharField(
        max_length=ADDR_LENGTH,
        unique=True,
        help_text=(
            "This is the address represented as a single string. Sometimes "
            "we need to manually break it up into its constituent parts so "
            "it is easier for machines to understand, which is what all "
            "the other fields in this model are for."
        ),
    )

    is_definitely_deliverable = models.BooleanField(
        verbose_name=(
            "This address is definitely deliverable "
            "(manually override Lob's address verification)"
        ),
        default=False,
        help_text=(
            "If you know for certain that this address is deliverable, even if Lob thinks "
            "otherwise, check this box. This will manually override Lob's verification "
            "and force any letters sent to this address to be mailed, assuming you have "
            "configured your "
            f'<a href="{LOB_STRICTNESS_HELP_URL}" '
            'target="_blank" rel="noopener nofollow">Lob strictness settings</a> to \'Relaxed\'.'
        ),
    )

    notes = models.TextField(
        blank=True,
        help_text=(
            "Notes about this address. In particular, if you had to override the deliverability "
            "of this address or change it in non-trivial ways, please add your rationale here."
        ),
    )

    def as_lob_params(self) -> Dict[str, str]:
        """
        Returns a dictionary representing the address that can be passed directly
        to Lob's verifications API: https://lob.com/docs#us_verifications_create
        """

        if not self.is_address_populated():
            return {"address": self.address}
        return super().as_lob_params()

    def __str__(self):
        return self.address.replace("\n", " / ")


class BaseLetterRequest(models.Model):
    class Meta:
        abstract = True

    mail_choice = models.TextField(
        max_length=30,
        choices=LOC_MAILING_CHOICES.choices,
        help_text="How the letter of complaint will be mailed.",
    )

    html_content = models.TextField(
        blank=True, help_text="The HTML content of the letter at the time it was requested."
    )

    lob_letter_object = JSONField(
        blank=True,
        null=True,
        help_text=(
            "If the letter was sent via Lob, this is the JSON response of the API call that "
            "was made to send the letter, documented at https://lob.com/docs/python#letters."
        ),
    )

    tracking_number = models.CharField(
        max_length=100,
        blank=True,
        help_text=(
            "The tracking number for the letter. Note that when this is changed, "
            "the user will be notified via SMS and added to a LOC follow-up campaign, "
            "if one has been configured."
        ),
    )

    letter_sent_at = models.DateTimeField(
        null=True, blank=True, help_text="When the letter was mailed through the postal service."
    )

    rejection_reason = models.CharField(
        max_length=100,
        blank=True,
        choices=LOC_REJECTION_CHOICES.choices,
        help_text="The reason we didn't mail the letter, if applicable.",
    )


class LetterRequest(BaseLetterRequest):
    """
    A completed letter of complaint request submitted by a user.
    """

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    user = models.OneToOneField(
        JustfixUser, on_delete=models.CASCADE, related_name="letter_request"
    )

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

    def __str__(self):
        if not (self.created_at and self.user and self.user.full_name):
            return super().__str__()
        return (
            f"{self.user.full_name}'s letter of complaint request from "
            f"{self.created_at.strftime('%A, %B %d %Y')}"
        )

    @property
    def lob_letter_html_description(self) -> str:
        """
        Return an HTML string that describes the mailed Lob letter. If
        the letter has not been sent through Lob, return an empty string.
        """

        lob_url = self.lob_url
        return lob_url and format_html(
            'The letter was <a href="{}" rel="noreferrer noopener" target="_blank">'
            "sent via Lob</a> with the tracking number {} and "
            "has an expected delivery date of {}.",
            lob_url,
            self.lob_letter_object["tracking_number"],
            self.lob_letter_object["expected_delivery_date"],
        )

    @property
    def lob_url(self) -> str:
        """
        Return the URL on Lob where more information about the mailed Lob
        version of this letter can be found.

        If the letter has not been sent through Lob, return an empty string.
        """

        if not self.lob_letter_object:
            return ""
        ltr_id = self.lob_letter_object["id"]

        # This URL structure isn't formally documented anywhere, it was
        # just inferred, so it could technically break at any time, but
        # it's better than nothing!
        return f"https://dashboard.lob.com/#/letters/{ltr_id}"

    @property
    def usps_tracking_url(self) -> str:
        """
        Return the URL on the USPS website where more information about
        the mailed letter can be found.

        If the letter has not been sent, return an empty string.
        """

        if not self.tracking_number:
            return ""

        return f"{USPS_TRACKING_URL_PREFIX}{self.tracking_number}"

    def can_change_content(self) -> bool:
        if self.__tracker.original_values["mail_choice"] == LOC_MAILING_CHOICES.USER_WILL_MAIL:
            return True
        if self.lob_letter_object is not None:
            return False
        if self.tracking_number:
            return False
        if self.created_at is None:
            return True
        return timezone.now() - self.created_at < LOC_CHANGE_LEEWAY

    def clean(self):
        super().clean()
        user = self.user

        if self.rejection_reason and self.tracking_number:
            raise ValidationError("Letter cannot be both rejected and mailed!")

        if user and self.mail_choice == LOC_MAILING_CHOICES.WE_WILL_MAIL:
            if user.issues.count() == 0 and user.custom_issues.count() == 0:
                raise ValidationError("Please select at least one issue from the issue checklist.")
            if user.access_dates.count() == 0:
                raise ValidationError("Please provide at least one access date.")
            if not hasattr(user, "landlord_details"):
                raise ValidationError("Please provide contact information for your landlord.")

        if self.__tracker.has_changed() and not self.can_change_content():
            raise ValidationError("Your letter is already being mailed!")

    def regenerate_html_content(self, author: str):
        from .views import react_render_loc_html
        import project.locales

        self.html_content = react_render_loc_html(
            self.user,
            project.locales.DEFAULT,
            html_comment=(
                f"<!-- This HTML was generated by {author} on "
                f"{datetime.datetime.now()} using git revision "
                f"{settings.GIT_INFO.get_version_str()}. -->\n"
            ),
        )

    def _on_tracking_number_changed(self):
        if not self.tracking_number:
            return
        self.user.chain_sms_async(
            [
                (
                    f"{get_site_name()} here - "
                    f"We've mailed the letter of complaint to your landlord. "
                    f"You can track its progress here: {self.usps_tracking_url} "
                    f"(link may take a day to update)"
                ),
                f"We'll follow up in about a week to see how things are going.",
            ]
        )
        self.user.trigger_followup_campaign_async("LOC")

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.__tracker.set_to_unchanged()

        if self.__tracking_number_tracker.has_changed():
            self._on_tracking_number_changed()

        self.__tracking_number_tracker.set_to_unchanged()

    def archive(self, notes: str = ""):
        from django.core.serializers import serialize, deserialize
        import json

        pk = self.pk

        with transaction.atomic():
            serialized = json.loads(serialize("json", [self]))[0]
            serialized["model"] = "loc.ArchivedLetterRequest"
            del serialized["pk"]
            archived = list(deserialize("json", json.dumps([serialized])))[0]
            archived.object.archived_at = timezone.now()
            archived.object.original_letter_request_id = pk
            archived.object.notes = notes
            archived.object.full_clean()
            archived.save()
            self.delete()
            return archived.object


def does_user_have_finished_loc(user: JustfixUser) -> bool:
    return hasattr(user, "letter_request") and bool(user.letter_request.html_content)


class ArchivedLetterRequest(BaseLetterRequest):
    """
    A completed letter of complaint request submitted by a user that is
    no longer used by the system.  Intended primarily for record-keeping
    purposes.

    Once a model of this type has been created, it's assumed that it
    is immutable, since it represents historical data.

    Note that ideally we would've simply had the `LetterRequest` model be
    a model with a `ForeignKey` relationship to `JustfixUser` rather than
    a `OneToOneField`, to accomodate the notion of archived letters,
    but by the time we really needed to remember archived letters, so
    much existing code assumed the `OneToOneField` that it became
    quite a hassle to make the migration. So instead, we're storing
    identical fields in a different model.
    """

    # Fields identical to LetterRequest fields.

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    # Fields specific to archived letter requests.

    archived_at = models.DateTimeField(
        help_text="When the LetterRequest this is based on was archived."
    )

    original_letter_request_id = models.IntegerField(
        help_text="The original primary key of the deleted LetterRequest this is based on."
    )

    user = models.ForeignKey(
        JustfixUser, on_delete=models.CASCADE, related_name="archived_letter_requests"
    )

    notes = models.TextField(
        help_text=(
            "Any additional notes about the archiving of this letter request, e.g. "
            "the reason for its archiving."
        ),
        blank=True,
    )
