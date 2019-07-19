from typing import List, Iterator, Any, Tuple, Optional
import itertools
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


def parse_landlord(name: str) -> Optional[Tuple[str, str]]:
    '''
    Parse a landlord's full name into a (firstname, lastname) tuple, e.g.:

        >>> parse_landlord('boop jones')
        ('boop', 'jones')

        >>> parse_landlord('funky monkey jones')
        ('funky monkey', 'jones')

    If the name can't be parsed, return None, e.g.:

        >>> parse_landlord('boop')
    '''

    parts = name.rsplit(' ', 1)
    if len(parts) != 2:
        return None
    firstname, lastname = parts
    return (firstname, lastname)


def get_csv_rows_for_multi_landlord_query(landlords: str) -> Iterator[List[Any]]:
    ll_list = list(filter(None, [parse_landlord(ll) for ll in split_into_list(landlords)]))
    if not ll_list or not settings.WOW_DATABASE:
        return iter([])
    full_sql = MULTI_LANDLORD_SQL.read_text() % {'full_intersection_sql': " INTERSECT ".join([
        r"SELECT unnest(get_regids_from_name(%s, %s)) AS registrationid"
    ] * len(ll_list))}
    args = list(itertools.chain(*ll_list))
    with connections[settings.WOW_DATABASE].cursor() as cursor:
        try:
            cursor.execute(full_sql, args)
        except ProgrammingError as e:
            logger.exception('An error occurred when running a data request SQL query.')
            lines = [[s] for s in str(e).split('\n')]
            yield from iter([['error'], *lines])
            return
        yield from generate_csv_rows(cursor)
