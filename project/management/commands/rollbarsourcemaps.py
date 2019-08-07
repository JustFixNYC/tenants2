from typing import List, Set
import json
import requests
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

from project.justfix_environment import BASE_DIR
from project.views import get_webpack_public_path_url

REACT_LOADABLE_JSON = BASE_DIR / 'react-loadable.json'

# https://docs.rollbar.com/docs/source-maps/#section-alternative-method-automatic-download
ROLLBAR_SOURCEMAP_URL = "https://api.rollbar.com/api/1/sourcemap/download"


def get_bundle_urls() -> List[str]:
    webpack_public_path_url = get_webpack_public_path_url()
    react_loadable = json.loads(REACT_LOADABLE_JSON.read_text())
    filenames: Set[str] = set()
    for info_list in react_loadable.values():
        for info in info_list:
            filenames.add(info['publicPath'])
    return [
        f"{webpack_public_path_url}{filename}"
        for filename in filenames
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
