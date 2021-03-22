from typing import List, Any, Optional, Dict, Union
import json
import requests
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

from project.justfix_environment import BASE_DIR
from frontend.initial_props import get_webpack_public_path_url

LOADABLE_STATS_JSON = BASE_DIR / "frontend" / "static" / "frontend" / "loadable-stats.json"

# https://docs.rollbar.com/docs/source-maps/#section-alternative-method-automatic-download
ROLLBAR_SOURCEMAP_URL = "https://api.rollbar.com/api/1/sourcemap/download"


def get_js_filename(asset: Union[str, List[str]]) -> str:
    """
    Given an asset in our loadable stats JSON, return its main JS filename.

    This accounts for the fact that, depending on whether we're inlining
    our sourcemaps or not, the asset can be a single string or a list of
    strings.
    """

    if isinstance(asset, str):
        return asset
    assert isinstance(asset, list), f"{asset} should be a list"
    js_filenames = [f for f in asset if f.endswith(".js")]
    assert len(js_filenames) == 1, f"{js_filenames} should have one item"
    return js_filenames[0]


def get_bundle_urls(
    loadable_stats: Optional[Dict[str, Any]] = None,
    webpack_public_path_url: Optional[str] = None,
) -> List[str]:
    if loadable_stats is None:
        loadable_stats = json.loads(LOADABLE_STATS_JSON.read_text())
    if webpack_public_path_url is None:
        webpack_public_path_url = get_webpack_public_path_url()
    return [
        f"{webpack_public_path_url}{get_js_filename(asset)}"
        for asset in loadable_stats["assetsByChunkName"].values()
    ]


def trigger_rollbar_sourcemap_download(access_token: str, version: str, minified_url: str):
    requests.post(
        ROLLBAR_SOURCEMAP_URL,
        data={"access_token": access_token, "version": version, "minified_url": minified_url},
    ).raise_for_status()


class Command(BaseCommand):
    help = "Upload source maps to Rollbar."

    def handle(self, *args, **options):
        if not settings.AWS_STORAGE_STATICFILES_BUCKET_NAME:
            raise CommandError("This command currently only works with AWS integration.")
        if not settings.ROLLBAR:
            raise CommandError("This command requires Rollbar integration.")
        urls = get_bundle_urls()
        self.stdout.write(f"Uploading {len(urls)} source maps to Rollbar...\n")
        for url in urls:
            trigger_rollbar_sourcemap_download(
                access_token=settings.ROLLBAR["access_token"],
                version=settings.GIT_INFO.get_version_str(),
                minified_url=url,
            )
        self.stdout.write("Done.\n")
