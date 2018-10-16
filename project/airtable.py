import sys
import time
from typing import Optional, Iterator, Tuple, List, Dict, TypeVar, Type, TextIO, Any
import json
import requests
import pydantic
import logging
from django.conf import settings

from users.models import JustfixUser
from project.util.settings_util import ensure_dependent_settings_are_nonempty


logger = logging.getLogger(__name__)


FT = TypeVar('FT', bound='Fields')

RATE_LIMIT_EXCEEDED = 429

RATE_LIMIT_TIMEOUT_SECS = 30


def validate_settings():
    '''
    Ensure that the Airtable-related settings are defined properly.
    '''

    ensure_dependent_settings_are_nonempty(
        'AIRTABLE_API_KEY',
        'AIRTABLE_URL'
    )


class Fields(pydantic.BaseModel):
    pk: int
    Name: str = ''

    @classmethod
    def from_user(cls: Type[FT], user: JustfixUser) -> FT:
        return cls(
            pk=user.pk,
            Name=user.full_name
        )


class Record(pydantic.BaseModel):
    id: str
    fields_: Fields = pydantic.Schema(default=..., alias='fields')
    createdTime: str


def retry_request(method: str, url: str, max_retries: int, headers: Dict[str, str],
                  **kwargs) -> requests.Response:
    attempts = 0

    while True:
        res = requests.request(
            method, url, headers=headers, timeout=settings.AIRTABLE_TIMEOUT, **kwargs)
        attempts += 1
        if attempts <= max_retries and res.status_code == RATE_LIMIT_EXCEEDED:
            time.sleep(RATE_LIMIT_TIMEOUT_SECS)
        else:
            return res


class Airtable:
    url: str
    api_key: str
    max_retries: int

    def __init__(self, url: Optional[str]=None, api_key: Optional[str]=None,
                 max_retries: int=0) -> None:
        self.url = url or settings.AIRTABLE_URL
        self.api_key = api_key or settings.AIRTABLE_API_KEY
        self.max_retries = max_retries
        if not (self.url and self.api_key):
            raise ValueError('Configuration not provided, and Django settings not configured')

    def request(self, method: str, pathname: Optional[str]=None, data: Optional[dict]=None,
                params: Optional[Dict[str, str]]=None) -> requests.Response:
        url = self.url if pathname is None else f"{self.url}/{pathname}"
        kwargs: Dict[str, Any] = {'params': params}
        headers = {'Authorization': f'Bearer {self.api_key}'}
        if data is not None:
            kwargs['data'] = json.dumps(data)
            headers['Content-Type'] = 'application/json'
        res = retry_request(method, url, max_retries=self.max_retries, headers=headers, **kwargs)
        res.raise_for_status()
        return res

    def create_or_update(self, fields: Fields) -> Record:
        record = self.get(fields.pk)
        if record is None:
            return self.create(fields)
        else:
            return self.update(record, fields)

    def update(self, record: Record, fields: Fields) -> Record:
        res = self.request('PATCH', record.id, data={
            "fields": fields.dict()
        })
        return Record(**res.json())

    def create(self, fields: Fields) -> Record:
        res = self.request('POST', data={
            "fields": fields.dict()
        })
        return Record(**res.json())

    def get(self, pk: int) -> Optional[Record]:
        res = self.request('GET', params={
            'filterByFormula': f'pk={pk}',
            'maxRecords': '1',
        })
        records = res.json()['records']
        if records:
            record = records[0]
            return Record(**record)
        return None

    def _get_list_page(self, page_size: int, offset: str) -> Tuple[List[Record], str]:
        params = {
            'pageSize': str(page_size),
        }
        if offset:
            params['offset'] = offset
        res = self.request('GET', params=params)
        result = res.json()
        next_offset = result.get('offset', '')
        records = [
            Record(**record) for record in result['records']
        ]
        return (records, next_offset)

    def list(self, page_size=100) -> Iterator[Record]:
        offset = ''

        while True:
            records, offset = self._get_list_page(page_size, offset)
            for record in records:
                yield record
            if not offset:
                break


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
