from typing import List, Iterator, Any
from django.db import connections
from django.conf import settings

from project.util.streaming_csv import generate_csv_rows


def split_into_list(value: str) -> List[str]:
    '''
    >>> split_into_list('boop,, blop')
    ['boop', 'blop']
    '''

    items = value.split(',')
    return list(filter(None, [item.strip() for item in items]))


def get_csv_rows_for_multi_landlord_query(landlords: str) -> Iterator[List[Any]]:
    landlords_list = split_into_list(landlords)
    if not landlords_list:
        return iter([])
    args = [[ll.upper() for ll in landlords_list]]
    with connections[settings.NYCDB_DATABASE].cursor() as cursor:
        cursor.execute("SELECT * FROM hpd_registrations WHERE boro = ANY(%s) LIMIT 10", args)
        yield from generate_csv_rows(cursor)
