import time
from typing import Optional, Iterator, Tuple, List, Dict, Any
import json
import requests

import logging
from django.conf import settings

from .record import Record, Fields


logger = logging.getLogger(__name__)

# Using a requests session for all our requests will ensure that we
# use keep-alive, which is a quick way to improve the speed of syncing
# when we have lots of data to sync.
req_session = requests.Session()

# Raw dictionary representation of a row in the Airtable, as retured
# by the API.
RawRow = Dict[str, Any]

# The HTTP status code returned by Airtable when it can't process
# something we gave it. This is usually caused because we're giving
# it fields that aren't currently in its schema.
UNPROCESSABLE_ENTITY = 422

# The HTTP status code returned by Airtable when its rate limit has
# been exceeded. From Airtable's documentation:
#
# > The API is limited to 5 requests per second. If you exceed this rate,
# > you will receive a 429 status code and will need to wait 30 seconds
# > before subsequent requests will succeed.
RATE_LIMIT_EXCEEDED = 429

# The amount of time, in seconds, we'll wait before retrying a request
# that failed due to rate limiting.
RATE_LIMIT_TIMEOUT_SECS = 30


def retry_request(method: str, url: str, max_retries: int, headers: Dict[str, str],
                  **kwargs) -> requests.Response:
    '''
    This wraps requests.request() but has built-in retry logic for when Airtable's
    rate limit is exceeded (up to a maximum number of retries).
    '''

    attempts = 0

    while True:
        res = req_session.request(
            method, url, headers=headers, timeout=settings.AIRTABLE_TIMEOUT, **kwargs)
        attempts += 1
        if attempts <= max_retries and res.status_code == RATE_LIMIT_EXCEEDED:
            time.sleep(RATE_LIMIT_TIMEOUT_SECS)
        else:
            return res


class Airtable:
    '''
    This class encapsulates the Airtable API.
    '''

    # The base URL endpoint for the Airtable, e.g.
    # "https://api.airtable.com/v0/appEH2XUPhLwkrS66/Users".
    url: str

    # The API key for Airtable.
    api_key: str

    # The maximum number of times we'll retry requests due to
    # rate limiting. If this is 0, then no retries will be attempted.
    max_retries: int

    def __init__(self, url: Optional[str] = None, api_key: Optional[str] = None,
                 max_retries: int = 0) -> None:
        self.url = url or settings.AIRTABLE_URL
        self.api_key = api_key or settings.AIRTABLE_API_KEY
        self.max_retries = max_retries
        if not (self.url and self.api_key):
            raise ValueError('Configuration not provided, and Django settings not configured')

    def request(self, method: str, pathname: Optional[str] = None, data: Optional[dict] = None,
                params: Optional[Dict[str, str]] = None) -> requests.Response:
        '''
        This wraps requests.request(), appending the given optional pathname to the
        base Airtable URL and sending the given optional data as JSON.

        Authorization credentials are automatically included in the request, and an
        exception is automatically raised if the request returns an error status code.
        '''

        url = self.url if pathname is None else f"{self.url}/{pathname}"
        kwargs: Dict[str, Any] = {'params': params}
        headers = {'Authorization': f'Bearer {self.api_key}'}
        if data is not None:
            kwargs['data'] = json.dumps(data)
            headers['Content-Type'] = 'application/json'
        res = retry_request(method, url, max_retries=self.max_retries, headers=headers, **kwargs)
        if res.status_code == UNPROCESSABLE_ENTITY:
            logger.error(
                f"It's likely that you need to add or change a field in your Airtable. "
                f"Hopefully this error message will help: {res.text}\n\n"
                f"This error occurred when submitting the following data: {data}"
            )
        res.raise_for_status()
        return res

    def create_or_update(self, fields: Fields) -> Record:
        '''
        Given the fields, this checks to see if a row already exists with the
        fields' primary key. If it does, the row will be updated; otherwise,
        a new row will be created.
        '''

        record = self.get(fields.pk)
        if record is None:
            return self.create(fields)
        else:
            return self.update(record, fields)

    def update(self, record: Record, fields: Fields) -> Record:
        '''
        Updates the given row in Airtable with the given fields.
        '''

        res = self.request('PATCH', record.id, data={
            "fields": fields.dict(by_alias=True)
        })
        return Record(**res.json())

    def create(self, fields: Fields) -> Record:
        '''
        Creates a new row in Airtable with the given fields.
        '''

        res = self.request('POST', data={
            "fields": fields.dict(by_alias=True)
        })
        return Record(**res.json())

    def get(self, pk: int) -> Optional[Record]:
        '''
        Attempts to retrieve the row in Airtable that has the given
        primary key. If it doesn't exist, None is returned.
        '''

        res = self.request('GET', params={
            'filterByFormula': f'pk={pk}',
            'maxRecords': '1',
        })
        records = res.json()['records']
        if records:
            record = records[0]
            return Record(**record)
        return None

    def _get_raw_list_page(self, page_size: int, offset: str) -> Tuple[List[RawRow], str]:
        params = {
            'pageSize': str(page_size),
        }
        if offset:
            params['offset'] = offset
        res = self.request('GET', params=params)
        result = res.json()
        next_offset = result.get('offset', '')
        return (result['records'], next_offset)

    def list_raw(self, page_size=100) -> Iterator[RawRow]:
        '''
        Iterate through all rows in the Airtable, but with raw dictionary data.
        '''

        offset = ''

        while True:
            records, offset = self._get_raw_list_page(page_size, offset)
            for record in records:
                yield record
            if not offset:
                break

    def list(self, page_size=100) -> Iterator[Record]:
        '''
        Iterate through all rows in the Airtable.
        '''

        for raw_record in self.list_raw(page_size):
            yield Record(**raw_record)
