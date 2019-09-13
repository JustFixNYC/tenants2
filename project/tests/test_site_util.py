from django.test import override_settings, TestCase
from django.conf import settings

from ..util.site_util import absolute_reverse, absolutify_url, get_site_name


class SiteUtilsTests(TestCase):
    @override_settings(DEBUG=False)
    def test_absolute_reverse_works(self):
        if settings.USE_I18N:
            url = 'https://example.com/en/graphql'
        else:
            url = 'https://example.com/graphql'
        self.assertEqual(
            absolute_reverse('batch-graphql'),
            url
        )

    def test_absolutify_url_raises_error_on_non_absolute_paths(self):
        with self.assertRaises(ValueError):
            absolutify_url('meh')

    def test_absolutify_url_passes_through_http_urls(self):
        self.assertEqual(absolutify_url('http://foo'), 'http://foo')

    def test_absolutify_url_passes_through_https_urls(self):
        self.assertEqual(absolutify_url('https://foo'), 'https://foo')

    @override_settings(DEBUG=False)
    def test_absolutify_url_works_in_production(self):
        self.assertEqual(
            absolutify_url('/boop'),
            'https://example.com/boop'
        )

    @override_settings(DEBUG=True)
    def test_absolutify_url_works_in_development(self):
        self.assertEqual(
            absolutify_url('/blap'),
            'http://example.com/blap'
        )


class TestGetSiteName:
    def test_it_works_when_deployment_name_is_undefined(self):
        assert get_site_name() == "JustFix.nyc"

    @override_settings(NAVBAR_LABEL="DEMO SITE")
    def test_it_works_when_deployment_name_is_defined(self):
        assert get_site_name() == "JustFix.nyc DEMO SITE"
