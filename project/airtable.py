import sys
from typing import Optional, Iterator, Tuple, List, Dict, TypeVar, Type, TextIO, Any
import json
import requests
import pydantic
import logging
from django.conf import settings

from users.models import JustfixUser


logger = logging.getLogger(__name__)


FT = TypeVar('FT', bound='Fields')


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


T = TypeVar('T', bound='Airtable')


class Airtable:
    url: str
    api_key: str

    def __init__(self, url: str, api_key: str) -> None:
        self.url = url
        self.api_key = api_key

    def request(self, method: str, pathname: Optional[str]=None, data: Optional[dict]=None,
                params: Optional[Dict[str, str]]=None) -> requests.Response:
        url = self.url if pathname is None else f"{self.url}/{pathname}"
        kwargs: Dict[str, Any] = {'params': params}
        headers = {'Authorization': f'Bearer {self.api_key}'}
        if data is not None:
            kwargs['data'] = json.dumps(data)
            headers['Content-Type'] = 'application/json'
        res = requests.request(method, url, headers=headers, **kwargs)
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

    @classmethod
    def from_settings(cls: Type[T]) -> T:
        return cls(
            url=settings.AIRTABLE_URL,
            api_key=settings.AIRTABLE_API_KEY
        )


class AirtableSynchronizer:
    airtable: Airtable

    def __init__(self, airtable: Optional[Airtable] = None) -> None:
        if airtable is None:
            airtable = Airtable.from_settings()
        self.airtable = airtable

    def _get_record_dict(self) -> Dict[int, Record]:
        records: Dict[int, Record] = {}

        for record in self.airtable.list():
            pk = record.fields_.pk
            if pk in records:
                logger.warn(f"Multiple rows with pk {pk} exist in Airtable!")
            records[record.fields_.pk] = record

        return records

    def sync_users(self, queryset=None, stdout: TextIO=sys.stdout):
        if queryset is None:
            queryset = JustfixUser.objects.all()
        records = self._get_record_dict()
        for user in queryset:
            our_fields = Fields.from_user(user)
            record = records.get(user.pk)
            if record is None:
                stdout.write(f"{user} does not exist in Airtable, adding them.\n")
                self.airtable.create(our_fields)
            else:
                if record.fields_ == our_fields:
                    stdout.write(f"{user} is already synced.\n")
                else:
                    stdout.write(f"Updating {user}.\n")
                    self.airtable.update(record, our_fields)
