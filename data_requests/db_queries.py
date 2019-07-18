from typing import List, Iterator, Any
import json
import logging
from pathlib import Path
from django.db import connections
from django.db.utils import ProgrammingError
from django.conf import settings

from project.util.streaming_csv import generate_csv_rows


MY_DIR = Path(__file__).parent.resolve()

MULTI_LANDLORD_SQL = MY_DIR / 'multi-landlord.sql'


logger = logging.getLogger(__name__)


def split_into_list(value: str) -> List[str]:
    '''
    >>> split_into_list('boop,, blop')
    ['boop', 'blop']
    '''

    items = value.split(',')
    return list(filter(None, [item.strip() for item in items]))


def get_csv_rows_for_multi_landlord_query(landlords: str) -> Iterator[List[Any]]:
    landlords_list = split_into_list(landlords)
    if not landlords_list or not settings.NYCDB_DATABASE:
        return iter([])
    args = {'landlords': json.dumps([{'value': ll.upper()} for ll in landlords_list])}
    with connections[settings.NYCDB_DATABASE].cursor() as cursor:
        try:
            cursor.execute(MULTI_LANDLORD_SQL.read_text(), args)
        except ProgrammingError as e:
            logger.exception('An error occurred when running a data request SQL query.')
            lines = [[s] for s in str(e).split('\n')]
            yield from iter([['error'], *lines])
            return
        yield from generate_csv_rows(cursor)
