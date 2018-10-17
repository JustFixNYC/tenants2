import time
from typing import Optional, Iterator, Tuple, List, Dict, Any
import json
import requests

import logging
from django.conf import settings

from .record import Record, Fields


logger = logging.getLogger(__name__)


RATE_LIMIT_EXCEEDED = 429

RATE_LIMIT_TIMEOUT_SECS = 30


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
