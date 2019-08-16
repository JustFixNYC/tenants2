import datetime
import re
from urllib.parse import urljoin
from django.core.management.base import BaseCommand
from django.contrib.sites.models import Site
import requests

from project import slack
from project.util.site_util import absolute_reverse
from .sendtestslack import get_site_hyperlink


def assert_equal(a, b):
    if a != b:
        raise AssertionError(f'{a} != {b}')


def get_base_mime_type(value: str) -> str:
    return value.split(';')[0]


def get_first_regex_match_group(pattern: str, text: str) -> str:
    m = re.search(pattern, text)
    if m is None:
        raise AssertionError(f'Unable to find match for {pattern}')
    return m.group(1)


def check_url(url: str, mime_type: str) -> requests.Response:
    r = requests.get(url)
    r.raise_for_status()
    assert_equal(get_base_mime_type(r.headers['Content-Type']), mime_type)
    return r


class Command(BaseCommand):
    help = 'Run a health check against the deployment.'

    def run_check(self):
        name = Site.objects.get_current().name
        start_time = datetime.datetime.now()

        homepage_url = absolute_reverse('react')
        r = check_url(homepage_url, 'text/html')
        css_url = get_first_regex_match_group(r'rel="stylesheet" href="([^"]*)"', r.text)
        css_url = urljoin(homepage_url, css_url)
        check_url(css_url, 'text/css')

        health_url = absolute_reverse('health')
        r = check_url(health_url, 'application/json')
        assert_equal(r.json()['status'], 200)

        total_time = datetime.datetime.now() - start_time
        self.stdout.write(f'Health check for {name} successful! Completed in {total_time}.')

    def handle(self, *args, **options):
        link = get_site_hyperlink()
        try:
            self.run_check()
        except Exception:
            self.stdout.write('Health check FAILED! Traceback follows.')
            slack.sendmsg_async(f'Health check for {link} FAILED!', is_safe=True)
            raise
