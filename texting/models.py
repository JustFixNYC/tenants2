from typing import Optional, TYPE_CHECKING
from django.db import models
from django.db.models.functions import Coalesce
from django.utils import timezone

from users.models import JustfixUser
from project.common_data import Choices
from project.util import phone_number as pn

if TYPE_CHECKING:
    from .twilio import SendSmsResult


# https://support.twilio.com/hc/en-us/articles/223134387-What-is-a-Message-SID-
TWILIO_SID_LENGTH = 34

REMINDERS = Choices(
    [
        ("LOC", "Letter of complaint reminder"),
        ("NORENT_CA_2020_11", "NoRent California reminder - November 2020"),
        ("NORENT_CA_2020_12", "NoRent California reminder - December 2020"),
        ("NORENT_CA_2021_01", "NoRent California reminder - January 2021"),
        ("NORENT_CA_2021_02", "NoRent California reminder - February 2021"),
        ("NORENT_CA_2021_03", "NoRent California reminder - March 2021"),
        ("NORENT_CA_2021_04", "NoRent California reminder - April 2021"),
        ("NORENT_CA_2021_05", "NoRent California reminder - May 2021"),
        ("NORENT_CA_2021_06", "NoRent California reminder - June 2021"),
        ("NORENT_CA_2021_07", "NoRent California reminder - July 2021"),
        ("NORENT_CA_2021_08", "NoRent California reminder - August 2021"),
        ("NORENT_CA_2021_09", "NoRent California reminder - September 2021"),
        ("NORENT_CA_2021_10", "NoRent California reminder - October 2021"),
    ]
)


def join_words(*words: Optional[str]) -> str:
    """
    Join together the given words, filtering out any
    falsy values, e.g.:

        >>> join_words('hi', '', None, 'there')
        'hi there'
    """

    return " ".join(filter(None, words))


class PhoneNumberLookupManager(models.Manager):
    def get_or_lookup(self, phone_number: str) -> Optional["PhoneNumberLookup"]:
        """
        Attempt to retrieve the PhoneNumberLookup with the given phone number.
        If one doesn't exist, attempt to contact Twilio to validate the number
        and obtain carrier information about it.

        Return None if Twilio integration is disabled or a network error occurred.
        """

        from .twilio import is_phone_number_valid

        lookup = self.filter(phone_number=phone_number).first()
        if lookup is not None:
            return lookup

        is_valid = is_phone_number_valid(phone_number)
        if is_valid is None:
            return None
        lookup = PhoneNumberLookup(phone_number=phone_number, is_valid=is_valid)
        lookup.save()
        return lookup

    def invalidate(self, phone_number: str) -> "PhoneNumberLookup":
        """
        Marks the given phone number as being invalid. Deals with the
        case where a phone number that was once valid is now invalid.
        """

        lookup, created = self.get_or_create(
            phone_number=phone_number,
            defaults={
                "is_valid": False,
            },
        )
        if not created:
            lookup.is_valid = False
            lookup.carrier = None
            lookup.save()
        return lookup


class PhoneNumberLookup(models.Model):
    """
    Information looked-up about a phone number via Twilio.
    """

    phone_number = models.CharField(unique=True, **pn.get_model_field_kwargs())

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    is_valid = models.BooleanField(help_text="Whether Twilio thinks the phone number is valid.")

    carrier = models.JSONField(
        default=None,
        null=True,
        help_text=(
            "Carrier information about the phone number. This is in the format "
            'specified in <a href="https://www.twilio.com/docs/lookup/api#lookups-carrier-info">'
            "Twilio's carrier information documentation</a>, though the keys are in snake-case "
            "rather than camel-case. This can be None if carrier info has not been looked up."
        ),
    )

    objects = PhoneNumberLookupManager()

    def save(self, *args, **kwargs):
        """
        Save the model, but first attempt to fetch carrier information if possible.
        """

        from .twilio import get_carrier_info

        if self.carrier is None and self.is_valid:
            self.carrier = get_carrier_info(self.phone_number)

        super().save(*args, **kwargs)

    @property
    def validity_str(self) -> str:
        """
        Return an adjective describing the validity of the phone number.
        """

        if self.is_valid is True:
            return "valid"
        elif self.is_valid is False:
            return "invalid"
        return "unknown"

    @property
    def carrier_type(self) -> str:
        """
        Return the carrier type of the phone number, or the empty
        string if it's not available. Valid carrier types include
        'landline', 'mobile', and 'voip'.
        """

        ctype = self.carrier and self.carrier.get("type")
        if ctype:
            return ctype
        return ""

    @property
    def adjectives(self) -> str:
        """
        Return a set of adjectives describing the type, e.g.:

            >>> PhoneNumberLookup().adjectives
            'unknown'

            >>> PhoneNumberLookup(is_valid=True, carrier={'type': 'mobile'}).adjectives
            'valid mobile'
        """

        return join_words(self.validity_str, self.carrier_type)

    @property
    def indefinite_article_with_adjectives(self) -> str:
        """
        Return an indefinite article with adjectives describing the type, e.g.:

            >>> PhoneNumberLookup().indefinite_article_with_adjectives
            'an unknown'

            >>> PhoneNumberLookup(is_valid=True).indefinite_article_with_adjectives
            'a valid'
        """

        adjs = self.adjectives
        article = "an" if adjs[0] in "aeiou" else "a"
        return f"{article} {adjs}"

    def __str__(self) -> str:
        """
        Return a description of the lookup, e.g.:

            >>> str(PhoneNumberLookup())
            'unknown phone number'

            >>> str(PhoneNumberLookup(is_valid=True, phone_number='5551234567'))
            'valid phone number 5551234567'
        """

        return join_words(self.adjectives, "phone number", self.phone_number)


class ReminderManager(models.Manager):
    @staticmethod
    def try_to_create_from_send_sms_result(
        ssr: "SendSmsResult", kind: str, user: JustfixUser
    ) -> Optional["Reminder"]:
        """
        Attempt to create a Reminder from the result of an SMS send, if the result
        is one that was either successful or indicates that the send should
        not be retried.

        If returned, the Reminder will have already been saved to the database.
        """

        if ssr.sid or not ssr.should_retry:
            reminder = Reminder(
                sid=ssr.sid, err_code=ssr.err_code, sent_at=timezone.now(), kind=kind, user=user
            )
            reminder.full_clean()
            reminder.save()
            return reminder
        return None


class Reminder(models.Model):
    """
    This model represents an SMS reminder we attempted to send to a user.
    """

    kind = models.TextField(
        max_length=30,
        choices=REMINDERS.choices,
        help_text="The type of reminder we attempted to send.",
    )

    sent_at = models.DateField(help_text="When we attempted to send the reminder.")

    user = models.ForeignKey(
        JustfixUser,
        on_delete=models.CASCADE,
        related_name="reminders",
        help_text="The user whom we attempted to send the reminder to.",
    )

    sid = models.CharField(
        max_length=TWILIO_SID_LENGTH,
        blank=True,
        help_text=(
            "The Twilio Message SID for the reminder, if we sent it. "
            "If an error occurred, this will be a blank string."
        ),
    )

    err_code = models.IntegerField(
        null=True,
        blank=True,
        help_text=(
            "The error code encountered when we attempted to send the reminder, if any."
            "If the reminder was sent successfully, this will be null.  Note that this "
            "error should reflect a reason for the reminder to not be sent at all--"
            "it should *not* represent a temporary error such as a networking error, "
            "where we would want to retry sending the message after some time."
        ),
    )

    objects = ReminderManager()


def exclude_users_with_invalid_phone_numbers(user_queryset):
    lookup = PhoneNumberLookup.objects.filter(phone_number=models.OuterRef("phone_number"))
    return user_queryset.annotate(
        is_phone_number_valid=Coalesce(models.Subquery(lookup.values("is_valid")), True)
    ).exclude(is_phone_number_valid=False)


def get_lookup_description_for_phone_number(phone_number: str) -> str:
    result = "No lookup details are available."
    if phone_number:
        info = PhoneNumberLookup.objects.get_or_lookup(phone_number)
        if info is not None:
            desc = info.indefinite_article_with_adjectives
            result = f"This appears to be {desc} phone number."
    return result
