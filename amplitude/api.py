import datetime
from time import sleep
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass, field
from django.utils.timezone import make_aware, utc
import requests

from project import common_data


_CONSTS = common_data.load_json("amplitude.json")

USER_ID_PREFIX: str = _CONSTS["USER_ID_PREFIX"]

# This is pre-defined by Amplitude for identify events, where we're
# not actually reporting a specific event that occurred but rather
# just updating user properties. For more information, see:
#
#     https://developers.amplitude.com/docs/batch-event-upload-api
IDENTIFY_EVENT = "$identify"

AMP_BATCH_URL = "https://api.amplitude.com/batch"

AMP_RATE_LIMIT_WAIT_SECS = 15

EPOCH = make_aware(datetime.datetime.utcfromtimestamp(0), timezone=utc)


# https://stackoverflow.com/a/11111177
def unix_time_millis(dt: datetime.datetime) -> int:
    return int((dt - EPOCH).total_seconds() * 1000.0)


@dataclass
class AmpEvent:
    # https://help.amplitude.com/hc/en-us/articles/360032842391-HTTP-API-V2

    user_id: Optional[int]

    event_type: str

    time: Optional[datetime.datetime] = None

    event_properties: Dict[str, Any] = field(default_factory=dict)

    user_properties: Dict[str, Any] = field(default_factory=dict)

    insert_id_suffix: Union[str, int, None] = None

    device_id: Optional[str] = None

    @property
    def insert_id(self) -> str:
        return "_".join(
            [
                str(part)
                for part in [
                    "user",
                    self.user_id,
                    self.device_id,
                    self.event_type,
                    self.insert_id_suffix,
                ]
                if part is not None
            ]
        )


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
        result: Dict[str, Any] = {
            "event_type": event.event_type,
            "user_properties": to_amp_props(event.user_properties),
        }
        assert (
            event.user_id is not None
        ) or event.device_id, "Amplitude events must have a user or device ID!"
        if event.user_id is not None:
            result["user_id"] = f"{USER_ID_PREFIX}{event.user_id}"
        if event.device_id is not None:
            result["device_id"] = event.device_id
        if event.time is not None:
            result["time"] = unix_time_millis(event.time)
        if event.event_type != IDENTIFY_EVENT:
            result.update(
                {
                    "event_properties": to_amp_props(event.event_properties),
                    "insert_id": event.insert_id,
                }
            )
        return result

    def __send_payload(self, payload: Dict[str, Any]):
        if self.dry_run:
            dry_print(self.dry_run, f"Payload: {payload}")
            return
        while True:
            res = requests.post(AMP_BATCH_URL, json=payload)
            if res.status_code == 429:
                print(f"Rate limit exceeded, waiting {AMP_RATE_LIMIT_WAIT_SECS}s...")
                sleep(AMP_RATE_LIMIT_WAIT_SECS)
            else:
                res.raise_for_status()
                return

    def upload(self):
        if self.__upload_queue:
            payload = {
                "api_key": self.api_key,
                "events": [self.__to_api_event(event) for event in self.__upload_queue],
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
