from django.test import override_settings, TestCase

from ..util.site_util import absolute_reverse, absolutify_url


class SiteUtilsTests(TestCase):
    @override_settings(DEBUG=False)
    def test_absolute_reverse_works(self):
        self.assertEqual(
            absolute_reverse('batch-graphql'),
            'https://example.com/graphql'
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
