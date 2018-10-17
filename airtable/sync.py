import sys
from typing import Optional, Dict, TextIO
import logging
from django.conf import settings

from users.models import JustfixUser
from .api import Airtable
from .record import Record, Fields

logger = logging.getLogger(__name__)


class AirtableSynchronizer:
    '''
    A class that encapsulates the synchronization of Airtable
    with our database.

    Note that by "synchronization" we mean unidirectional synchronization
    from the server to Airtable. Any changes made to fields we synchronize
    on the Airtable side will be overwritten by us during the
    synchronization process!
    '''

    # A reference to our Airtable API.
    airtable: Airtable

    def __init__(self, airtable: Optional[Airtable] = None) -> None:
        if airtable is None:
            airtable = Airtable()
        self.airtable = airtable

    def _get_record_dict(self) -> Dict[int, Record]:
        '''
        Retrieve *all* Airtable rows and return a mapping from JustfixUser
        primary keys to Airtable rows.
        '''

        records: Dict[int, Record] = {}

        for record in self.airtable.list():
            pk = record.fields_.pk
            if pk in records:
                logger.warn(f"Multiple rows with pk {pk} exist in Airtable!")
            records[record.fields_.pk] = record

        return records

    def _sync_user(self, user: JustfixUser, records: Dict[int, Record], stdout: TextIO):
        '''
        Synchronize a single user with Airtable.  If the user is already synchronized
        with Airtable, nothing is done.
        '''

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
        '''
        Synchronize the users in the given queryset with Airtable. If no
        queryset is provided, all users are synchronized.
        '''

        if queryset is None:
            queryset = JustfixUser.objects.all()
        records = self._get_record_dict()
        for user in queryset:
            self._sync_user(user, records, stdout)


def sync_user(user: JustfixUser):
    '''
    Attempt to synchronize the given user with Airtable, but catch and log any
    exceptions due to network errors.

    If Airtable is not configured, this function does nothing.

    This is intended as an "eager" way for the server to synchronize with
    Airtable; it should be supplemented with a more reliable synchronization
    mechanism that isn't as eager, but ensures eventual consistency, such
    as the "syncairtable" management command.
    '''

    if not settings.AIRTABLE_API_KEY:
        return

    fields = Fields.from_user(user)
    airtable = Airtable(max_retries=0)
    try:
        airtable.create_or_update(fields)
    except Exception:
        logger.exception('Error while communicating with Airtable')
