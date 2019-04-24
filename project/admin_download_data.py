import datetime
from typing import NamedTuple, Callable, Any, Optional, List, Iterator, Dict
from contextlib import contextmanager
from django.http import HttpResponseNotFound
from django.db import connection
from django.core.exceptions import PermissionDenied
from django.shortcuts import reverse

from users.models import CHANGE_USER_PERMISSION
from project.util.streaming_csv import generate_csv_rows, streaming_csv_response
from project.util.streaming_json import generate_json_rows, streaming_json_response
from issues.management.commands.issuestats import execute_issue_stats_query
from project.management.commands.userstats import execute_user_stats_query


# Ideally we would have a real type for a database cursor but I'm not sure
# what it is. The actual type passed from Django appears to be a
# django.db.backends.utils.CursorDebugWrapper but it feels weird to use that.
DBCursor = Any


class DownloadUrl(NamedTuple):
    fmt: str
    url: str


class DataDownload(NamedTuple):
    name: str
    slug: str
    html_desc: str
    perms: List[str]
    execute_query: Callable[[DBCursor], None]

    def _get_download_url(self, fmt: str) -> DownloadUrl:
        return DownloadUrl(fmt, reverse('admin:download-data', kwargs={
            'dataset': self.slug,
            'fmt': fmt
        }))

    def urls(self) -> List[DownloadUrl]:
        return [
            self._get_download_url(fmt) for fmt in ['csv', 'json']
        ]

    @contextmanager
    def _get_cursor_and_execute_query(self):
        with connection.cursor() as cursor:
            self.execute_query(cursor)
            yield cursor

    def generate_csv_rows(self) -> Iterator[List[Any]]:
        with self._get_cursor_and_execute_query() as cursor:
            yield from generate_csv_rows(cursor)

    def generate_json_rows(self) -> Iterator[Dict[str, Any]]:
        with self._get_cursor_and_execute_query() as cursor:
            yield from generate_json_rows(cursor)


DATA_DOWNLOADS = [
    DataDownload(
        name='User statistics',
        slug='userstats',
        html_desc="""
            Anonymized statistics about each user,
            including when they completed onboarding, sent a letter of complaint,
            and so on.
            """,
        perms=[CHANGE_USER_PERMISSION],
        execute_query=lambda cur: execute_user_stats_query(cur, include_pad_bbl=False)
    ),
    DataDownload(
        name='User statistics with BBLs',
        slug='userstats-with-bbls',
        html_desc="""
            This is like the user statistics data but also includes the BBL of each user,
            <strong>which could potentially be used to personally identify them</strong>.
            """,
        perms=[CHANGE_USER_PERMISSION],
        execute_query=lambda cur: execute_user_stats_query(cur, include_pad_bbl=True)
    ),
    DataDownload(
        name='Issue statistics',
        slug='issuestats',
        html_desc="""Various statistics about the issue checklist.""",
        perms=[CHANGE_USER_PERMISSION],
        execute_query=execute_issue_stats_query
    ),
]


def get_data_download(slug: str) -> Optional[DataDownload]:
    for download in DATA_DOWNLOADS:
        if download.slug == slug:
            return download
    return None


def get_available_datasets(user) -> List[DataDownload]:
    return [
        download
        for download in DATA_DOWNLOADS
        if user.has_perms(download.perms)
    ]


def download_streaming_data(request, dataset: str, fmt: str):
    download = get_data_download(dataset)
    if download is None:
        return HttpResponseNotFound("Unknown dataset")
    if not request.user.has_perms(download.perms):
        raise PermissionDenied()
    today = datetime.datetime.today().strftime('%Y-%m-%d')
    filename = f"{dataset}-{today}.{fmt}"
    if fmt == 'csv':
        return streaming_csv_response(download.generate_csv_rows(), filename)
    elif fmt == 'json':
        return streaming_json_response(download.generate_json_rows(), filename)
    else:
        return HttpResponseNotFound("Invalid format")
