import datetime
from time import sleep
from typing import Any, Dict, List, Union
from dataclasses import dataclass, field
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.utils.timezone import make_aware, utc
import requests

from users.models import JustfixUser
from onboarding.models import OnboardingInfo


RELATED_MODELS = [
    'letter_request',
]

AMP_RATE_LIMIT_WAIT_SECS = 15

EPOCH = make_aware(datetime.datetime.utcfromtimestamp(0), timezone=utc)


# https://stackoverflow.com/a/11111177
def unix_time_millis(dt: datetime.datetime) -> int:
    return int((dt - EPOCH).total_seconds() * 1000.0)


@dataclass
class AmpEvent:
    # https://help.amplitude.com/hc/en-us/articles/360032842391-HTTP-API-V2

    user_id: int

    event_type: str

    time: datetime.datetime

    event_properties: Dict[str, Any] = field(default_factory=dict)

    user_properties: Dict[str, Any] = field(default_factory=dict)

    insert_id_suffix: Union[str, int, None] = None

    @property
    def insert_id(self) -> str:
        return '_'.join([
            str(part) for part in ['user', self.user_id, self.event_type, self.insert_id_suffix]
            if part is not None
        ])


def to_amp_props(props: Dict[str, Any]) -> Dict[str, Any]:
    amp_props: Dict[str, Any] = {}
    for key, value in props.items():
        if isinstance(value, datetime.datetime):
            value = value.isoformat()
        amp_props[key] = value
    return amp_props


def dry_print(dry_run: bool, message: str):
    prefix = "[DRY RUN] " if dry_run else ""
    print(f"{prefix}{message}")


class AmpEventUploader:
    BATCH_SIZE = 1000

    def __init__(self, api_key: str, dry_run: bool):
        self.api_key = api_key
        self.dry_run = dry_run
        self.total_events = 0
        self.__upload_queue: List[AmpEvent] = []

    def queue(self, event: AmpEvent):
        self.total_events += 1
        self.__upload_queue.append(event)
        if len(self.__upload_queue) >= self.BATCH_SIZE:
            self.upload()

    def __to_api_event(self, event: AmpEvent) -> Dict[str, Any]:
        return {
            # user_id needs to be at least 5 characters, so we'll prefix it.
            'user_id': f'user_{event.user_id}',
            'event_type': event.event_type,
            'insert_id': event.insert_id,
            'time': unix_time_millis(event.time),
            'event_properties': to_amp_props(event.event_properties),
            'user_properties': to_amp_props(event.user_properties),
        }

    def __send_payload(self, payload: Dict[str, Any]):
        if self.dry_run:
            dry_print(self.dry_run, f"Payload: {payload}")
            return
        while True:
            res = requests.post("https://api.amplitude.com/batch", json=payload)
            if res.status_code == 429:
                print(f"Rate limit exceeded, waiting {AMP_RATE_LIMIT_WAIT_SECS}s...")
                sleep(AMP_RATE_LIMIT_WAIT_SECS)
            else:
                res.raise_for_status()
                return

    def upload(self):
        if self.__upload_queue:
            payload = {
                'api_key': self.api_key,
                'events': [
                    self.__to_api_event(event)
                    for event in self.__upload_queue
                ]
            }
            dry_print(self.dry_run, f"Uploading {len(self.__upload_queue)} events.")
            self.__send_payload(payload)
            self.__upload_queue = []

    def __enter__(self):
        return self

    def __exit__(self, _type, value, traceback):
        if _type is None:
            self.upload()
            dry_print(self.dry_run, f"Done uploading {self.total_events} total events.")


class Command(BaseCommand):
    help = 'Export event data to Amplitude.'

    dry_run: bool

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', help="don't actually send anything to Amplitude.",
                            action='store_true')

    def upload_letter_request_events(self, user: JustfixUser, uploader: AmpEventUploader):
        lr = user.letter_request if hasattr(user, 'letter_request') else None
        if lr:
            uploader.queue(AmpEvent(
                user_id=user.pk,
                event_type="letter_request",
                event_properties={
                    'mail_choice': lr.mail_choice,
                },
                time=lr.created_at,
                insert_id_suffix=lr.pk,
            ))
            if lr.letter_sent_at:
                uploader.queue(AmpEvent(
                    user_id=user.pk,
                    event_type="letter_sent",
                    time=lr.letter_sent_at,
                    insert_id_suffix=lr.pk,
                ))

    def upload_events(self, onb: OnboardingInfo, uploader: AmpEventUploader):
        dry_print(self.dry_run, f"Processing user {onb.user.username}.")
        user: JustfixUser = onb.user
        uploader.queue(AmpEvent(
            user_id=user.pk,
            event_type="onboarding",
            user_properties={
                'signup_intent': onb.signup_intent,
                'borough': onb.borough,
                'zipcode': onb.zipcode,
                'is_in_eviction': onb.is_in_eviction,
                'needs_repairs': onb.needs_repairs,
                'has_no_services': onb.has_no_services,
                'has_pests': onb.has_pests,
                'has_called_311': onb.has_called_311,
                'lease_type': onb.lease_type,
                'receives_public_assistance': onb.receives_public_assistance,
                'can_we_sms': onb.can_we_sms,
            },
            time=onb.created_at
        ))
        self.upload_letter_request_events(user, uploader)

    def handle(self, *args, **options):
        self.dry_run = options['dry_run']
        if not settings.AMPLITUDE_API_KEY:
            raise CommandError('AMPLITUDE_API_KEY must be configured.')
        with AmpEventUploader(settings.AMPLITUDE_API_KEY, dry_run=self.dry_run) as uploader:
            for onb in OnboardingInfo.objects.all().select_related('user', *[
                f"user__{model}" for model in RELATED_MODELS
            ]):
                self.upload_events(onb, uploader)
