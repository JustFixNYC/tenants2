import re
from typing import List, Optional
from datetime import datetime, timedelta
from django.conf import settings
from django.db import transaction
from django.core.management.base import CommandError, BaseCommand
from django.utils import timezone
from temba_client.v2 import TembaClient

from rapidpro.models import Metadata, ContactGroup, UserContactGroup
from users.models import JustfixUser

URN_TEL_REGEX = re.compile(r'^tel:\+1(\d+)$')

CLOCK_SKEW = timedelta(minutes=5)


def find_phone_number_from_urns(urns: List[str]) -> Optional[str]:
    '''
    >>> find_phone_number_from_urns(['blarg'])
    >>> find_phone_number_from_urns(['blarg', 'tel:+15551234567'])
    '5551234567'
    '''

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
    client = TembaClient(settings.RAPIDPRO_HOSTNAME, settings.RAPIDPRO_API_TOKEN)
    return client.get_contacts(
        after=after
    ).iterfetches(retry_on_rate_exceed=True)


class Command(BaseCommand):
    help = 'Sync with RapidPro.'

    @transaction.atomic
    def sync(self):
        hostname = settings.RAPIDPRO_HOSTNAME
        self.stdout.write(f"Syncing with {hostname}...")
        sync_time = timezone.now() - CLOCK_SKEW
        metadata, _ = Metadata.objects.get_or_create()
        batches = get_contact_batches(after=metadata.last_sync)
        for contact_batch in batches:
            self.stdout.write(f"Processing a batch of {len(contact_batch)} contacts.\n")
            for contact in contact_batch:
                user = find_user_from_urns(contact.urns)
                if user is None:
                    continue
                self.stdout.write(f"Syncing user {user} ({len(contact.groups)} groups).\n")
                for group in contact.groups:
                    # Get the contact group from the database, creating it if needed.
                    cg, _ = ContactGroup.objects.get_or_create(
                        uuid=group.uuid,
                        defaults={'name': group.name}
                    )
                    # Associate the user with any groups they're in that we don't
                    # already know of.
                    UserContactGroup.objects.get_or_create(
                        user=user,
                        group=cg,
                        defaults={'earliest_known_date': contact.modified_on}
                    )

                # Now find any existing groups the user is no longer in, and
                # delete the user's association with them.
                UserContactGroup.objects.filter(user=user).exclude(group__uuid__in=[
                    group.uuid for group in contact.groups
                ]).delete()

        metadata.last_sync = sync_time
        metadata.save()
        self.stdout.write(f"Done syncing with {hostname}.\n")

    def handle(self, *args, **options):
        if not settings.RAPIDPRO_API_TOKEN:
            raise CommandError("RAPIDPRO_API_TOKEN must be configured.")
        self.sync()
