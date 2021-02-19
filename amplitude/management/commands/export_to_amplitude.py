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
        ...


class UserSynchronizer(Synchronizer):
    @classmethod
    def iter_events(cls, last_synced_at: datetime.datetime) -> Iterator[AmpEvent]:
        # We need to be very careful here that we don't conflict with any of
        # the user properties sent by the front-end code!  See amplitude.ts for
        # more details.
        qs = OnboardingInfo.objects.filter(
            Q(updated_at__gte=last_synced_at) | Q(user__last_login__gte=last_synced_at)
        ).select_related("user")
        for oi in qs:
            user = oi.user
            yield AmpEvent(
                user_id=user.pk,
                event_type=IDENTIFY_EVENT,
                user_properties={
                    "canWeSms": oi.can_we_sms,
                    "canRtcSms": oi.can_rtc_sms,
                    "canHj4aSms": oi.can_hj4a_sms,
                    "hasEmail": bool(user.email),
                    "lastLogin": user.last_login,
                    "dateJoined": user.date_joined,
                    "adminUrl": absolute_reverse("admin:users_justfixuser_change", args=(user.pk,)),
                },
            )


class EfnySynchronizer(Synchronizer):
    @classmethod
    def iter_events(cls, last_synced_at: datetime.datetime) -> Iterator[AmpEvent]:
        qs = SubmittedHardshipDeclaration.objects.filter(
            updated_at__gte=last_synced_at, fully_processed_at__isnull=False
        ).select_related("user")
        for shd in qs:
            dv = shd.declaration_variables
            yield AmpEvent(
                user_id=shd.user.id,
                event_type="Submitted EvictionFree declaration",
                time=shd.created_at,
                event_properties={
                    "locale": shd.locale,
                    "wasMailed": bool(shd.mailed_at),
                    "wasEmailed": bool(shd.emailed_at),
                    "hasFinancialHardship": dv["has_financial_hardship"],
                    "hasHealthRisk": dv["has_health_risk"],
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

        if not self.dry_run:
            sync.last_synced_at = update_time
            sync.save()

    def handle(self, *args, **options):
        self.dry_run = options["dry_run"]
        if not settings.AMPLITUDE_API_KEY:
            raise CommandError("AMPLITUDE_API_KEY must be configured.")
        for kind, label in SYNC_CHOICES.choices:
            print(f"Synchronizing {label} with Amplitude.")
            self.sync(kind)
