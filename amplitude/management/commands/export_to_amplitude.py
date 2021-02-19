import datetime
from abc import ABC, abstractmethod
from typing import Dict, Iterator
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.utils.timezone import now
from django.db.models import Q

from project.util.site_util import absolute_reverse
from onboarding.models import OnboardingInfo
from amplitude.models import Sync, SYNC_CHOICES
from amplitude.api import AmpEvent, AmpEventUploader, IDENTIFY_EVENT, EPOCH
from evictionfree.models import SubmittedHardshipDeclaration


class Synchronizer(ABC):
    @classmethod
    @abstractmethod
    def iter_events(cls, last_synced_at: datetime.datetime) -> Iterator[AmpEvent]:
        pass


class UserSynchronizer(Synchronizer):
    @classmethod
    def iter_events(cls, last_synced_at: datetime.datetime) -> Iterator[AmpEvent]:
        # We need to be very careful here that we don't conflict with any of
        # the user properties sent by the front-end code!  See amplitude.ts for
        # more details.
        qs = OnboardingInfo.objects.filter(
            Q(updated_at__gte=last_synced_at) | Q(user__last_login__gte=last_synced_at)
        ).values(
            "can_we_sms",
            "can_rtc_sms",
            "can_hj4a_sms",
            "user__email",
            "user__id",
            "user__last_login",
            "user__date_joined",
        )
        for item in qs:
            uid: int = item["user__id"]
            yield AmpEvent(
                user_id=uid,
                event_type=IDENTIFY_EVENT,
                user_properties={
                    "canWeSms": item["can_we_sms"],
                    "canRtcSms": item["can_rtc_sms"],
                    "canHj4aSms": item["can_hj4a_sms"],
                    "hasEmail": bool(item["user__email"]),
                    "lastLogin": item["user__last_login"],
                    "dateJoined": item["user__date_joined"],
                    "adminUrl": absolute_reverse("admin:users_justfixuser_change", args=(uid,)),
                },
            )


class EfnySynchronizer(Synchronizer):
    @classmethod
    def iter_events(cls, last_synced_at: datetime.datetime) -> Iterator[AmpEvent]:
        qs = SubmittedHardshipDeclaration.objects.filter(
            updated_at__gte=last_synced_at, fully_processed_at__isnull=False
        ).values(
            "user__id",
            "locale",
            "mailed_at",
            "emailed_at",
            "created_at",
        )
        for item in qs:
            yield AmpEvent(
                user_id=item["user__id"],
                event_type="Submitted EvictionFree Hardship Declaration",
                time=item["created_at"],
                event_properties={
                    "locale": item["locale"],
                    "mailedAt": item["mailed_at"],
                    "emailedAt": item["emailed_at"],
                },
            )


SYNCHRONIZERS: Dict[str, Synchronizer] = {
    SYNC_CHOICES.USERS: UserSynchronizer(),
    SYNC_CHOICES.EVICTIONFREE: EfnySynchronizer(),
}


class Command(BaseCommand):
    help = "Export event data to Amplitude."

    dry_run: bool

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run", help="don't actually send anything to Amplitude.", action="store_true"
        )

    def sync(self, kind: str):
        sync, _ = Sync.objects.get_or_create(kind=kind, defaults={"last_synced_at": EPOCH})
        update_time = now()

        synchronizer = SYNCHRONIZERS[kind]

        with AmpEventUploader(settings.AMPLITUDE_API_KEY, dry_run=self.dry_run) as uploader:
            for event in synchronizer.iter_events(sync.last_synced_at):
                uploader.queue(event)

        sync.last_synced_at = update_time
        sync.save()

    def handle(self, *args, **options):
        self.dry_run = options["dry_run"]
        if not settings.AMPLITUDE_API_KEY:
            raise CommandError("AMPLITUDE_API_KEY must be configured.")
        for kind, label in SYNC_CHOICES.choices:
            print(self.dry_run, f"Synchronizing {label} with Amplitude.")
            self.sync(kind)
