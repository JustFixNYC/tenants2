import sys
from typing import Optional, Dict, TextIO
import logging
from django.conf import settings

from users.models import JustfixUser
from .api import Airtable
from .record import Record, Fields

logger = logging.getLogger(__name__)


class AirtableSynchronizer:
    airtable: Airtable

    def __init__(self, airtable: Optional[Airtable] = None) -> None:
        if airtable is None:
            airtable = Airtable()
        self.airtable = airtable

    def _get_record_dict(self) -> Dict[int, Record]:
        records: Dict[int, Record] = {}

        for record in self.airtable.list():
            pk = record.fields_.pk
            if pk in records:
                logger.warn(f"Multiple rows with pk {pk} exist in Airtable!")
            records[record.fields_.pk] = record

        return records

    def _sync_user(self, user: JustfixUser, records: Dict[int, Record], stdout: TextIO):
        our_fields = Fields.from_user(user)
        record = records.get(user.pk)
        if record is None:
            stdout.write(f"{user} does not exist in Airtable, adding them.\n")
            self.airtable.create(our_fields)
        elif record.fields_ == our_fields:
            stdout.write(f"{user} is already synced.\n")
        else:
            stdout.write(f"Updating {user}.\n")
            self.airtable.update(record, our_fields)

    def sync_users(self, queryset=None, stdout: TextIO=sys.stdout):
        if queryset is None:
            queryset = JustfixUser.objects.all()
        records = self._get_record_dict()
        for user in queryset:
            self._sync_user(user, records, stdout)


def sync_user(user: JustfixUser):
    if not settings.AIRTABLE_API_KEY:
        return

    fields = Fields.from_user(user)
    airtable = Airtable(max_retries=0)
    try:
        airtable.create_or_update(fields)
    except Exception:
        logger.exception('Error while communicating with Airtable')
