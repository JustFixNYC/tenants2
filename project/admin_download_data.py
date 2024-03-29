import datetime
import logging
from pathlib import Path
from typing import NamedTuple, Callable, Any, Optional, List, Iterator, Dict
from contextlib import contextmanager
from django.http import HttpResponseNotFound, HttpResponse
from django.db import connection, DEFAULT_DB_ALIAS
from django.db.models import QuerySet
from django.core.exceptions import PermissionDenied
from django.shortcuts import reverse
from django.urls import path
from django.conf import settings
from django.template.response import TemplateResponse
from django.views.decorators.gzip import gzip_page
from django.contrib.auth.models import AnonymousUser

from users.models import JustfixUser
from project.util.streaming_csv import generate_csv_rows, streaming_csv_response
from project.util.streaming_json import generate_json_rows, streaming_json_response
from project.util.data_dictionary import DataDictDocs, DataDictionary, get_data_dictionary


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
        return DownloadUrl(
            fmt, reverse("admin:download-data", kwargs={"dataset": self.slug, "fmt": fmt})
        )

    def json_url(self) -> str:
        return self._get_download_url("json").url

    def urls(self) -> List[DownloadUrl]:
        return [self._get_download_url(fmt) for fmt in ["csv", "json"]]

    def data_dictionary_url(self) -> str:
        return reverse("admin:download-data-dictionary", kwargs={"dataset": self.slug})

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

    def has_data_dictionary(self) -> bool:
        return bool(self.get_data_dictionary(AnonymousUser()))

    def get_data_dictionary(self, user: JustfixUser) -> Optional[DataDictionary]:
        execute_query = self.execute_query
        if isinstance(execute_query, QuerysetDataDownload):
            return execute_query.get_data_dictionary(user)
        return None


def get_all_data_downloads() -> List[DataDownload]:
    from issues import issuestats
    from project import userstats, sandefur_data
    from hpaction import ehpa_filings
    from partnerships import admin_data_downloads as partnership_stats
    from norent import admin_data_downloads as norent_stats
    from evictionfree import admin_data_downloads as evictionfree_stats
    from laletterbuilder import admin_data_downloads as laletterbuilder_stats

    return [
        *userstats.DATA_DOWNLOADS,
        *issuestats.DATA_DOWNLOADS,
        *ehpa_filings.DATA_DOWNLOADS,
        *partnership_stats.DATA_DOWNLOADS,
        *norent_stats.DATA_DOWNLOADS,
        *evictionfree_stats.DATA_DOWNLOADS,
        *laletterbuilder_stats.DATA_DOWNLOADS,
        *sandefur_data.DATA_DOWNLOADS,
    ]


def get_data_download(slug: str) -> Optional[DataDownload]:
    for download in get_all_data_downloads():
        if download.slug == slug:
            return download
    return None


def strict_get_data_download(slug: str) -> DataDownload:
    download = get_data_download(slug)
    if download is None:
        raise ValueError(f"data download does not exist: {slug}")
    return download


def get_available_datasets(user) -> List[DataDownload]:
    return [download for download in get_all_data_downloads() if user.has_perms(download.perms)]


def _get_debug_data_response(dataset: str, fmt: str, filename: str):
    path = Path(settings.DEBUG_DATA_DIR) / f"{dataset}.{fmt}"
    if settings.DEBUG and settings.DEBUG_DATA_DIR and path.exists():
        logger.info(f"Serving '{path}' as the '{dataset}' data download.")
        response = HttpResponse(
            path.read_bytes(), content_type={"csv": "text/csv", "json": "application/json"}[fmt]
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
    return None


def _get_streaming_response(download: DataDownload, fmt: str, filename: str, user: JustfixUser):
    if fmt == "csv":
        return streaming_csv_response(download.generate_csv_rows(user), filename)
    elif fmt == "json":
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
    today = datetime.datetime.today().strftime("%Y-%m-%d")
    filename = f"{dataset}-{today}.{fmt}"
    debug_response = _get_debug_data_response(dataset, fmt, filename)

    return debug_response or _get_streaming_response(download, fmt, filename, request.user)


class DownloadDataViews:
    def __init__(self, site):
        self.site = site

    def get_urls(self):
        return [
            path(
                "download-data/", self.site.admin_view(self.index_page), name="download-data-index"
            ),
            path(
                "download-data/<slug:dataset>.<slug:fmt>",
                self.site.admin_view(download_streaming_data),
                name="download-data",
            ),
            path(
                "download-data/dictionary/<slug:dataset>",
                self.site.admin_view(self.data_dictionary),
                name="download-data-dictionary",
            ),
        ]

    def index_page(self, request):
        return TemplateResponse(
            request,
            "admin/justfix/download_data.html",
            {
                **self.site.each_context(request),
                "datasets": get_available_datasets(request.user),
                "title": "Download data",
            },
        )

    def data_dictionary(self, request, dataset: str):
        download = get_data_download(dataset)
        if download is None:
            return HttpResponseNotFound("Unknown dataset")
        if not request.user.has_perms(download.perms):
            raise PermissionDenied()
        data_dictionary = download.get_data_dictionary(request.user)
        return TemplateResponse(
            request,
            "admin/justfix/data_dictionary.html",
            {
                "download": download,
                "data_dictionary": data_dictionary,
                "title": f"Data dictionary for {download.name}",
            },
        )


class QuerysetDataDownload:
    def __init__(
        self,
        get_queryset: Callable[[JustfixUser], QuerySet],
        extra_docs: Optional[DataDictDocs] = None,
    ):
        self.get_queryset = get_queryset
        self.extra_docs = extra_docs

    def __call__(self, cursor: DBCursor, user: JustfixUser) -> None:
        queryset = self.get_queryset(user)
        exec_queryset_on_cursor(queryset, cursor)

    def get_data_dictionary(self, user: JustfixUser) -> DataDictionary:
        return get_data_dictionary(self.get_queryset(user), self.extra_docs)


def queryset_data_download(func: Callable[[JustfixUser], QuerySet]) -> QuerysetDataDownload:
    """
    This decorator makes it easier to define data downloads in
    terms of QuerySet objects, rather than operations on raw
    database cursors.
    """

    return QuerysetDataDownload(func)


def exec_queryset_on_cursor(queryset, cursor):
    """
    Executes the given Django queryset on the given database cursor.
    """

    compiler = queryset.query.get_compiler(using=DEFAULT_DB_ALIAS)
    sql, params = compiler.as_sql()
    cursor.execute(sql, params)
