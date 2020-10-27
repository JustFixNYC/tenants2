import datetime
import logging
from pathlib import Path
from typing import NamedTuple, Callable, Any, Optional, List, Iterator, Dict
from contextlib import contextmanager
from django.http import HttpResponseNotFound, HttpResponse
from django.db import connection
from django.core.exceptions import PermissionDenied
from django.shortcuts import reverse
from django.urls import path
from django.conf import settings
from django.template.response import TemplateResponse
from django.views.decorators.gzip import gzip_page

from users.models import CHANGE_USER_PERMISSION, JustfixUser
from project.util.streaming_csv import generate_csv_rows, streaming_csv_response
from project.util.streaming_json import generate_json_rows, streaming_json_response
from issues.issuestats import execute_issue_stats_query
from project.userstats import execute_user_stats_query
from hpaction.ehpa_filings import execute_ehpa_filings_query
from partnerships.admin_data_downloads import (
    execute_partner_users_query,
    execute_partner_user_issues_query,
)


logger = logging.getLogger(__name__)

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
    execute_query: Callable[[DBCursor, JustfixUser], None]

    def _get_download_url(self, fmt: str) -> DownloadUrl:
        return DownloadUrl(fmt, reverse('admin:download-data', kwargs={
            'dataset': self.slug,
            'fmt': fmt
        }))

    def json_url(self) -> str:
        return self._get_download_url('json').url

    def urls(self) -> List[DownloadUrl]:
        return [
            self._get_download_url(fmt) for fmt in ['csv', 'json']
        ]

    @contextmanager
    def _get_cursor_and_execute_query(self, user: JustfixUser):
        with connection.cursor() as cursor:
            self.execute_query(cursor, user)
            yield cursor

    def generate_csv_rows(self, user: JustfixUser) -> Iterator[List[Any]]:
        with self._get_cursor_and_execute_query(user) as cursor:
            yield from generate_csv_rows(cursor)

    def generate_json_rows(self, user: JustfixUser) -> Iterator[Dict[str, Any]]:
        with self._get_cursor_and_execute_query(user) as cursor:
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
        execute_query=lambda cur, user: execute_user_stats_query(cur, include_pad_bbl=False)
    ),
    DataDownload(
        name='User statistics with BBLs',
        slug='userstats-with-bbls',
        html_desc="""
            This is like the user statistics data but also includes the BBL of each user,
            <strong>which could potentially be used to personally identify them</strong>.
            """,
        perms=[CHANGE_USER_PERMISSION],
        execute_query=lambda cur, user: execute_user_stats_query(cur, include_pad_bbl=True)
    ),
    DataDownload(
        name='Issue statistics',
        slug='issuestats',
        html_desc="""Various statistics about the issue checklist.""",
        perms=[CHANGE_USER_PERMISSION],
        execute_query=lambda cur, user: execute_issue_stats_query(cur)
    ),
    DataDownload(
        name='EHPA filings',
        slug='ehpa-filings',
        html_desc="""
            Details about tenants who have filed Emergency HP Actions.  Intended
            primarily for handing off to NYC HRA/OCJ.  This contains PII, so
            please be careful with it.  <strong>Note:</strong> most of the
            fields here represent <em>current</em> user data rather than
            data as it existed when the user filed the EHPA.
            """,
        perms=[CHANGE_USER_PERMISSION],
        execute_query=lambda cur, user: execute_ehpa_filings_query(cur),
    ),
    DataDownload(
        name="Partner-affiliated users",
        slug="partner-users",
        html_desc="""
            Details about users who were referred to JustFix by
            partner organization(s) you're affiliated with. Contains PII.
            """,
        perms=['partnerships.view_users'],
        execute_query=execute_partner_users_query,
    ),
    DataDownload(
        name="Partner-affiliated user issues",
        slug="partner-user-issues",
        html_desc="""
            Details about the issues of users who were referred to JustFix by
            partner organization(s) you're affiliated with. Contains PII.
            """,
        perms=['partnerships.view_users'],
        execute_query=execute_partner_user_issues_query,
    ),
]


def get_data_download(slug: str) -> Optional[DataDownload]:
    for download in DATA_DOWNLOADS:
        if download.slug == slug:
            return download
    return None


def strict_get_data_download(slug: str) -> DataDownload:
    download = get_data_download(slug)
    if download is None:
        raise ValueError(f"data download does not exist: {slug}")
    return download


def get_available_datasets(user) -> List[DataDownload]:
    return [
        download
        for download in DATA_DOWNLOADS
        if user.has_perms(download.perms)
    ]


def _get_debug_data_response(dataset: str, fmt: str, filename: str):
    path = Path(settings.DEBUG_DATA_DIR) / f'{dataset}.{fmt}'
    if settings.DEBUG and settings.DEBUG_DATA_DIR and path.exists():
        logger.info(f"Serving '{path}' as the '{dataset}' data download.")
        response = HttpResponse(
            path.read_bytes(),
            content_type={
                'csv': 'text/csv',
                'json': 'application/json'
            }[fmt]
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    return None


def _get_streaming_response(download: DataDownload, fmt: str, filename: str, user: JustfixUser):
    if fmt == 'csv':
        return streaming_csv_response(download.generate_csv_rows(user), filename)
    elif fmt == 'json':
        return streaming_json_response(download.generate_json_rows(user), filename)
    else:
        return HttpResponseNotFound("Invalid format")


@gzip_page
def download_streaming_data(request, dataset: str, fmt: str):
    download = get_data_download(dataset)
    if download is None:
        return HttpResponseNotFound("Unknown dataset")
    if not request.user.has_perms(download.perms):
        raise PermissionDenied()
    today = datetime.datetime.today().strftime('%Y-%m-%d')
    filename = f"{dataset}-{today}.{fmt}"
    debug_response = _get_debug_data_response(dataset, fmt, filename)

    return debug_response or _get_streaming_response(download, fmt, filename, request.user)


class DownloadDataViews:
    def __init__(self, site):
        self.site = site

    def get_urls(self):
        return [
            path('download-data/',
                 self.site.admin_view(self.index_page),
                 name='download-data-index'),
            path('download-data/<slug:dataset>.<slug:fmt>',
                 self.site.admin_view(download_streaming_data),
                 name='download-data'),
        ]

    def index_page(self, request):
        return TemplateResponse(request, "admin/justfix/download_data.html", {
            **self.site.each_context(request),
            'datasets': get_available_datasets(request.user),
            'title': "Download data"
        })
