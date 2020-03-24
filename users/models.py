import logging
from typing import List
from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager
from django.utils.crypto import get_random_string

from texting import twilio
from project.util.site_util import absolute_reverse
from project.util import phone_number as pn
from .permission_util import ModelPermissions


FULL_NAME_MAXLEN = 150

VIEW_LETTER_REQUEST_PERMISSION = 'loc.view_letterrequest'

CHANGE_LETTER_REQUEST_PERMISSION = 'loc.change_letterrequest'

CHANGE_USER_PERMISSION = 'users.change_justfixuser'

VIEW_TEXT_MESSAGE_PERMISSION = 'texting_history.view_message'

ROLES = {}

ROLES['Outreach Coordinators'] = set([
    'users.add_justfixuser',
    CHANGE_USER_PERMISSION,
    'legacy_tenants.change_legacyuserinfo',
    *ModelPermissions('loc', 'accessdate').all,
    *ModelPermissions('issues', 'issue').all,
    *ModelPermissions('issues', 'customissue').all,
    'loc.add_landlorddetails',
    'loc.change_landlorddetails',
    'loc.add_letterrequest',
    CHANGE_LETTER_REQUEST_PERMISSION,
    'loc.delete_letterrequest',
    VIEW_LETTER_REQUEST_PERMISSION,
    'loc.change_addressdetails',
    *ModelPermissions('hpaction', 'hpactiondocuments').all,
    *ModelPermissions('hpaction', 'harassmentdetails').all,
    *ModelPermissions('hpaction', 'feewaiverdetails').all,
    *ModelPermissions('hpaction', 'tenantchild').all,
    *ModelPermissions('hpaction', 'priorcase').all,
    *ModelPermissions('hpaction', 'hpactiondetails').all,
    'hpaction.view_hpuser',
    'onboarding.add_onboardinginfo',
    'onboarding.change_onboardinginfo',
    'rh.view_rentalhistoryrequest',
    VIEW_TEXT_MESSAGE_PERMISSION,
])

ROLES['Tenant Resource Editors'] = set([
    *ModelPermissions('findhelp', 'tenantresource').all,
    'findhelp.view_communitydistrict',
    'findhelp.view_neighborhood',
    'findhelp.view_borough',
    'findhelp.view_zipcode',
])


logger = logging.getLogger(__name__)


class JustfixUserManager(UserManager):
    def generate_random_username(self, prefix='') -> str:
        while True:
            username = prefix + get_random_string(
                length=12,
                allowed_chars='abcdefghijklmnopqrstuvwxyz'
            )
            if not self.filter(username=username).exists():
                return username


class JustfixUser(AbstractUser):
    phone_number = models.CharField(
        'Phone number',
        unique=True,
        **pn.get_model_field_kwargs()
    )

    is_email_verified = models.BooleanField(
        default=False,
        help_text=(
            "Whether the user has verified that they 'own' their email "
            "address by clicking on a link we emailed them."
        ),
    )

    objects = JustfixUserManager()

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['username', 'email']

    @property
    def full_name(self) -> str:
        if self.first_name and self.last_name:
            return ' '.join([self.first_name, self.last_name])
        return ''

    def formatted_phone_number(self) -> str:
        return pn.humanize(self.phone_number)

    @property
    def can_we_sms(self) -> bool:
        return hasattr(self, 'onboarding_info') and self.onboarding_info.can_we_sms

    def _log_sms(self):
        if self.can_we_sms:
            logging.info(f"Sending a SMS to user {self.username}.")
        else:
            logging.info(f"Not sending a SMS to user {self.username} because they opted out.")

    def send_sms(self, body: str, fail_silently=True) -> str:
        self._log_sms()
        if self.can_we_sms:
            return twilio.send_sms(self.phone_number, body, fail_silently=fail_silently)
        return ''

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
            logging.info(f"Triggering rapidpro campaign '{campaign_name}' on user "
                         f"{self.username}.")
            fc.trigger_followup_campaign_async(
                self.full_name,
                self.phone_number,
                campaign_name
            )
        else:
            logging.info(
                f"Not triggering rapidpro campaign '{campaign_name}' on user "
                f"{self.username} because they opted out."
            )

    @property
    def admin_url(self):
        return absolute_reverse('admin:users_justfixuser_change', args=[self.pk])

    def __str__(self):
        if self.username:
            return self.username
        return '<unnamed user>'
