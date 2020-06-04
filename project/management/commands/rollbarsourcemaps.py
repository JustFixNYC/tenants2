from typing import List
import json
import requests
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

from project.justfix_environment import BASE_DIR
from frontend.initial_props import get_webpack_public_path_url

LOADABLE_STATS_JSON = BASE_DIR / 'frontend' / 'static' / 'frontend' / 'loadable-stats.json'

# https://docs.rollbar.com/docs/source-maps/#section-alternative-method-automatic-download
ROLLBAR_SOURCEMAP_URL = "https://api.rollbar.com/api/1/sourcemap/download"


def get_bundle_urls() -> List[str]:
    webpack_public_path_url = get_webpack_public_path_url()
    loadable_stats = json.loads(LOADABLE_STATS_JSON.read_text())
    return [
        f"{webpack_public_path_url}{filename}"
        for filename in loadable_stats["assetsByChunkName"].values()
    ]


def trigger_rollbar_sourcemap_download(
    access_token: str,
    version: str,
    minified_url: str
):
    requests.post(ROLLBAR_SOURCEMAP_URL, data={
        'access_token': access_token,
        'version': version,
        'minified_url': minified_url
    }).raise_for_status()


class Command(BaseCommand):
    help = 'Upload source maps to Rollbar.'

    def handle(self, *args, **options):
        if not settings.AWS_STORAGE_STATICFILES_BUCKET_NAME:
            raise CommandError('This command currently only works with AWS integration.')
        if not settings.ROLLBAR:
            raise CommandError('This command requires Rollbar integration.')
        urls = get_bundle_urls()
        self.stdout.write(f'Uploading {len(urls)} source maps to Rollbar...\n')
        for url in urls:
            trigger_rollbar_sourcemap_download(
                access_token=settings.ROLLBAR['access_token'],
                version=settings.GIT_INFO.get_version_str(),
                minified_url=url
            )
        self.stdout.write('Done.\n')
