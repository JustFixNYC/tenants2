from typing import List, Optional, Tuple
from django.db import models
from django.db.models.functions import Coalesce

from users.models import JustfixUser
from project.common_data import Choices
from project.util import phone_number as pn

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
        Attept to retrieve the PhoneNumberLookup with the given phone number.
        If one doesn't exist, attempt to contact Twilio to validate the number
        and obtain carrier information about it.

        Return None if Twilio integration is disabled or a network error occured.
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

    def invalidate(
        self, phone_number: str, twilio_err_code: Optional[int] = None
    ) -> "PhoneNumberLookup":
        """
        Marks the given phone number as being invalid. Deals with the
        case where a phone number that was once valid is now invalid.
        """

        lookup, created = self.get_or_create(
            phone_number=phone_number,
            defaults={
                "is_valid": False,
                "twilio_err_code": twilio_err_code,
            },
        )
        if not created:
            lookup.is_valid = False
            lookup.carrier = None
            lookup.twilio_err_code = twilio_err_code
            lookup.save()
        return lookup


class PhoneNumberLookup(models.Model):
    """
    Information looked-up about a phone number via Twilio.
    """

    # https://www.twilio.com/docs/api/errors/21211
    TWILIO_INVALID_TO_NUMBER_ERR = 21211

    # https://www.twilio.com/docs/api/errors/21610
    TWILIO_SEND_TO_UNSUBSCRIBED_RECIPIENT_ERR = 21610

    TWILIO_ERR_CODE_CHOICES: List[Tuple[int, str]] = [
        (TWILIO_INVALID_TO_NUMBER_ERR, "invalid"),
        (TWILIO_SEND_TO_UNSUBSCRIBED_RECIPIENT_ERR, "blocked"),
    ]

    TWILIO_ERR_CODES_DICT = dict(TWILIO_ERR_CODE_CHOICES)

    phone_number = models.CharField(unique=True, **pn.get_model_field_kwargs())

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    is_valid = models.BooleanField(
        help_text=(
            "Whether we think the phone number is valid for the purposes "
            "of sending SMS numbers to it."
        )
    )

    twilio_err_code = models.IntegerField(
        null=True,
        blank=True,
        choices=TWILIO_ERR_CODE_CHOICES,
        help_text=(
            "If we think the phone number is invalid, this is the Twilio error code that "
            "underlies our reasoning."
        ),
    )

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
            return self.TWILIO_ERR_CODES_DICT.get(self.twilio_err_code, "invalid")
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


class Reminder(models.Model):
    """
    This model represents a reminder sent to users.
    """

    kind = models.TextField(
        max_length=30, choices=REMINDERS.choices, help_text="The type of reminder sent."
    )

    sent_at = models.DateField(help_text="When the reminder was sent.")

    user = models.ForeignKey(
        JustfixUser,
        on_delete=models.CASCADE,
        related_name="reminders",
        help_text="The user the reminder was sent to.",
    )

    sid = models.CharField(
        max_length=TWILIO_SID_LENGTH, help_text="The Twilio Message SID for the reminder."
    )


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
