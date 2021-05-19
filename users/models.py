import logging
import random
from typing import List, Optional
from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager
from django.utils.crypto import get_random_string

from texting import twilio
from project.util.site_util import absolute_reverse
from project.util import phone_number as pn
from project.locales import LOCALE_KWARGS
from .permission_util import ModelPermissions


IMPERSONATE_USERS_PERMISSION = "users.impersonate_users"

ADD_SERVING_PAPERS_PERMISSION = "hpaction.add_servingpapers"

VIEW_LETTER_REQUEST_PERMISSION = "loc.view_letterrequest"

CHANGE_LETTER_REQUEST_PERMISSION = "loc.change_letterrequest"

VIEW_USER_PERMISSION = "users.view_justfixuser"

CHANGE_USER_PERMISSION = "users.change_justfixuser"

VIEW_TEXT_MESSAGE_PERMISSION = "texting_history.view_message"

ROLES = {}

ROLES["Outreach Coordinators"] = set(
    [
        "users.add_justfixuser",
        VIEW_USER_PERMISSION,
        CHANGE_USER_PERMISSION,
        *ModelPermissions("loc", "accessdate").all,
        *ModelPermissions("issues", "issue").all,
        *ModelPermissions("issues", "customissue").all,
        "loc.add_landlorddetails",
        "loc.change_landlorddetails",
        "loc.add_letterrequest",
        CHANGE_LETTER_REQUEST_PERMISSION,
        VIEW_LETTER_REQUEST_PERMISSION,
        "loc.view_archivedletterrequest",
        "loc.change_addressdetails",
        "loc.change_locuser",
        *ModelPermissions("hpaction", "hpactiondocuments").all,
        *ModelPermissions("hpaction", "docusignenvelope").all,
        *ModelPermissions("hpaction", "harassmentdetails").all,
        *ModelPermissions("hpaction", "feewaiverdetails").all,
        *ModelPermissions("hpaction", "tenantchild").all,
        *ModelPermissions("hpaction", "priorcase").all,
        *ModelPermissions("hpaction", "hpactiondetails").all,
        ADD_SERVING_PAPERS_PERMISSION,
        "hpaction.change_servingpapers",
        "hpaction.change_hpuser",
        "onboarding.add_onboardinginfo",
        "onboarding.change_onboardinginfo",
        *ModelPermissions("norent", "rentperiod").only(add=True, change=True),
        *ModelPermissions("norent", "letter").all,
        "norent.change_norentuser",
        "rh.view_rentalhistoryrequest",
        VIEW_TEXT_MESSAGE_PERMISSION,
        *ModelPermissions("evictionfree", "submittedhardshipdeclaration").all,
        *ModelPermissions("evictionfree", "hardshipdeclarationdetails").all,
        "evictionfree.change_evictionfreeuser",
        IMPERSONATE_USERS_PERMISSION,
        "django_sql_dashboard.execute_sql",
    ]
)

ROLES["Tenant Resource Editors"] = set(
    [
        *ModelPermissions("findhelp", "tenantresource").all,
        "findhelp.view_communitydistrict",
        "findhelp.view_neighborhood",
        "findhelp.view_borough",
        "findhelp.view_zipcode",
    ]
)


logger = logging.getLogger(__name__)


def create_random_phone_number() -> str:
    """
    Returns a random phone number in the 555 area code.
    """

    return "555" + "".join([str(random.choice(range(10))) for _ in range(7)])


class JustfixUserManager(UserManager):
    def generate_random_username(self, prefix="") -> str:
        while True:
            username = prefix + get_random_string(
                length=12, allowed_chars="abcdefghijklmnopqrstuvwxyz"
            )
            if not self.filter(username=username).exists():
                return username

    def find_random_unused_phone_number(self) -> str:
        """
        Returns a random unused phone number in the 555 area code.
        """

        while True:
            phone_number = create_random_phone_number()
            if not self.filter(phone_number=phone_number).exists():
                return phone_number


class JustfixUser(AbstractUser):
    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
        permissions = [
            ("impersonate_users", "Can impersonate other users"),
            (
                "download_sandefur_data",
                "Can download data needed for Rebecca Sandefur's research",
            ),
        ]

    phone_number = models.CharField("Phone number", unique=True, **pn.get_model_field_kwargs())

    is_email_verified = models.BooleanField(
        default=False,
        help_text=(
            "Whether the user has verified that they 'own' their email "
            "address by clicking on a link we emailed them."
        ),
    )

    locale = models.CharField(
        **LOCALE_KWARGS,
        help_text="The user's preferred locale/language.",
    )

    objects = JustfixUserManager()

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS = ["username", "email"]

    @property
    def full_legal_name(self) -> str:
        if self.first_name and self.last_name:
            return " ".join([self.first_name, self.last_name])
        return ""

    def as_email_recipient(self) -> Optional[str]:
        """
        Attempts to construct the most informative string
        that can be pasted into an email's to/cc/bcc/reply-to field.

        If a user has only an email address, it will return that:

            >>> u = JustfixUser(email="boop@jones.net")
            >>> u.as_email_recipient()
            'boop@jones.net'

        But if the user has a full name, it will also return that:

            >>> u.first_name = "Boop"
            >>> u.last_name = "Jones"
            >>> u.as_email_recipient()
            'Boop Jones <boop@jones.net>'

        And if the user has no email, it will just return None:

            >>> JustfixUser().as_email_recipient() is None
            True
        """

        value: str = self.email
        if not value:
            return None
        if self.full_legal_name:
            value = f"{self.full_legal_name} <{value}>"
        return value

    def formatted_phone_number(self) -> str:
        return pn.humanize(self.phone_number)

    @property
    def can_we_sms(self) -> bool:
        return hasattr(self, "onboarding_info") and self.onboarding_info.can_we_sms

    def _log_sms(self):
        if self.can_we_sms:
            logging.info(f"Sending a SMS to user {self.username}.")
        else:
            logging.info(f"Not sending a SMS to user {self.username} because they opted out.")

    def send_sms(self, body: str, fail_silently=True) -> str:
        self._log_sms()
        if self.can_we_sms:
            return twilio.send_sms(self.phone_number, body, fail_silently=fail_silently)
        return ""

    def send_sms_async(self, body: str) -> None:
        self._log_sms()
        if self.can_we_sms:
            twilio.send_sms_async(self.phone_number, body)

    def chain_sms_async(self, bodies: List[str]) -> None:
        self._log_sms()
        if self.can_we_sms:
            twilio.chain_sms_async(self.phone_number, bodies)

    def trigger_followup_campaign_async(self, campaign_name: str) -> None:
        from rapidpro import followup_campaigns as fc

        fc.ensure_followup_campaign_exists(campaign_name)

        if self.can_we_sms:
            logging.info(
                f"Triggering rapidpro campaign '{campaign_name}' on user " f"{self.username}."
            )
            fc.trigger_followup_campaign_async(
                self.full_legal_name,
                self.phone_number,
                campaign_name,
                locale=self.locale,
            )
        else:
            logging.info(
                f"Not triggering rapidpro campaign '{campaign_name}' on user "
                f"{self.username} because they opted out."
            )

    @property
    def admin_url(self):
        return absolute_reverse("admin:users_justfixuser_change", args=[self.pk])

    @property
    def amplitude_url(self) -> Optional[str]:
        from amplitude.util import get_url_for_user_page

        return get_url_for_user_page(self)

    def __str__(self):
        if self.username:
            return self.username
        return "<unnamed user>"
