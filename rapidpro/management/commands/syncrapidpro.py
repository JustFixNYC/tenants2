import re
from typing import List, Optional
from datetime import datetime, timedelta
from django.conf import settings
from django.db import transaction
from django.core.management.base import CommandError, BaseCommand
from django.utils import timezone
from temba_client.v2 import TembaClient

from rapidpro.models import Metadata, ContactGroup, UserContactGroup, Contact
from rapidpro import rapidpro_util
from users.models import JustfixUser

URN_TEL_REGEX = re.compile(r"^tel:\+1(\d+)$")

CLOCK_SKEW = timedelta(minutes=5)


def find_phone_number_from_urns(urns: List[str]) -> Optional[str]:
    """
    >>> find_phone_number_from_urns(['blarg'])
    >>> find_phone_number_from_urns(['blarg', 'tel:+15551234567'])
    '5551234567'
    """

    for urn in urns:
        match = URN_TEL_REGEX.match(urn)
        if match:
            return match.group(1)

    return None


def find_user_from_urns(urns: List[str]) -> Optional[JustfixUser]:
    phone_number = find_phone_number_from_urns(urns)
    if phone_number is None:
        return None
    return JustfixUser.objects.filter(phone_number=phone_number).first()


def get_contact_batches(after: Optional[datetime]):
    client = get_rapidpro_client()
    return client.get_contacts(after=after).iterfetches(retry_on_rate_exceed=True)


def ensure_rapidpro_is_configured():
    # This will throw if RapidPro isn't configured.
    get_rapidpro_client()


def get_rapidpro_client() -> TembaClient:
    client = rapidpro_util.get_client_from_settings()
    if client is None:
        raise CommandError("RAPIDPRO_API_TOKEN must be configured.")
    return client


class Command(BaseCommand):
    help = "Sync with RapidPro."

    def add_arguments(self, parser):
        parser.add_argument(
            "--full-resync", action="store_true", help="Completely re-sync all users."
        )

    def sync_contact_group(self, group) -> ContactGroup:
        cg, _ = ContactGroup.objects.get_or_create(uuid=group.uuid, defaults={"name": group.name})
        if cg.name != group.name:
            cg.name = group.name
            cg.save()
        return cg

    def _sync_contact_model(self, temba_contact):
        phone_number = find_phone_number_from_urns(temba_contact.urns)
        if phone_number is None:
            return
        contact, created = Contact.objects.get_or_create(uuid=temba_contact.uuid)
        contact.phone_number = phone_number
        contact.save()

    def sync_contact(self, contact):
        self._sync_contact_model(contact)
        user = find_user_from_urns(contact.urns)
        if user is None:
            # NOTE: Because we ignore contact groups that don't map to existing users,
            # new app users who have been RapidPro contacts for a long time won't
            # necessarily be perfectly in-sync (any RapidPro contact information
            # will only show up on the Django side when the RapidPro contact is
            # next modified, or when a full resync occurs).
            return
        self.stdout.write(f"Syncing user {user} ({len(contact.groups)} groups).\n")
        for group in contact.groups:
            # Get the contact group from the database, creating it if needed.
            cg = self.sync_contact_group(group)
            # Associate the user with any groups they're in that we don't
            # already know of.
            UserContactGroup.objects.get_or_create(
                user=user, group=cg, defaults={"earliest_known_date": contact.modified_on}
            )

        # Now find any existing groups the user is no longer in, and
        # delete the user's association with them.
        UserContactGroup.objects.filter(user=user).exclude(
            group__uuid__in=[group.uuid for group in contact.groups]
        ).delete()

    @transaction.atomic
    def sync(self, full_resync: bool):
        hostname = settings.RAPIDPRO_HOSTNAME
        self.stdout.write(f"Syncing with {hostname}...")
        sync_time = timezone.now() - CLOCK_SKEW
        metadata, _ = Metadata.objects.get_or_create()
        after = None if full_resync else metadata.last_sync
        batches = get_contact_batches(after=after)
        for contact_batch in batches:
            self.stdout.write(f"Processing a batch of {len(contact_batch)} contacts.\n")
            for contact in contact_batch:
                self.sync_contact(contact)
        metadata.last_sync = sync_time
        metadata.save()
        self.stdout.write(f"Done syncing with {hostname}.\n")

    def handle(self, *args, **options):
        ensure_rapidpro_is_configured()
        self.sync(full_resync=options["full_resync"])
