from typing import Optional, Iterator, Tuple, List, Dict
import json
import requests
import pydantic
import logging
from django.conf import settings

from users.models import JustfixUser


logger = logging.getLogger(__name__)


def get_base_headers() -> Dict[str, str]:
    return {
        'Authorization': f'Bearer {settings.AIRTABLE_API_KEY}',
    }


class Fields(pydantic.BaseModel):
    pk: int
    Name: str = ''


class Record(pydantic.BaseModel):
    id: str
    fields_: Fields = pydantic.Schema(default=..., alias='fields')
    createdTime: str


def get_fields_for_user(user: JustfixUser) -> Fields:
    return Fields(
        pk=user.pk,
        Name=user.full_name
    )


def create_or_update(fields: Fields) -> Record:
    record = get(fields.pk)
    if record is None:
        return create(fields)
    else:
        return update(record, fields)


def update(record: Record, fields: Fields) -> Record:
    res = requests.patch(f"{settings.AIRTABLE_URL}/{record.id}", headers={
        'Content-Type': 'application/json',
        **get_base_headers()
    }, data=json.dumps({
        "fields": fields.dict()
    }))
    res.raise_for_status()
    print(res.json())
    return Record(**res.json())


def create(fields: Fields) -> Record:
    res = requests.post(settings.AIRTABLE_URL, headers={
        'Content-Type': 'application/json',
        **get_base_headers()
    }, data=json.dumps({
        "fields": fields.dict()
    }))
    res.raise_for_status()
    return Record(**res.json())


def get(pk: int) -> Optional[Record]:
    res = requests.get(settings.AIRTABLE_URL, headers=get_base_headers(), params={
        'filterByFormula': f'pk={pk}',
        'maxRecords': '1',
    })
    res.raise_for_status()
    records = res.json()['records']
    if records:
        record = records[0]
        return Record(**record)
    return None


def _get_list_page(page_size: int, offset: str) -> Tuple[List[Record], str]:
    params = {
        'pageSize': str(page_size),
    }
    if offset:
        params['offset'] = offset
    res = requests.get(settings.AIRTABLE_URL, headers=get_base_headers(), params=params)
    res.raise_for_status()
    result = res.json()
    next_offset = result.get('offset', '')
    records = [
        Record(**record) for record in result['records']
    ]
    return (records, next_offset)


def list_(page_size=100) -> Iterator[Record]:
    offset = ''

    while True:
        records, offset = _get_list_page(page_size, offset)
        for record in records:
            yield record
        if not offset:
            break


def get_record_dict() -> Dict[int, Record]:
    records: Dict[int, Record] = {}

    for record in list_():
        pk = record.fields_.pk
        if pk in records:
            logger.warn(f"Multiple rows with pk {pk} exist in Airtable!")
        records[record.fields_.pk] = record

    return records
