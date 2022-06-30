import pytest
from django.test import override_settings, TestCase
from django.contrib.sites.models import Site

from ..util.site_util import (
    absolute_reverse,
    absolutify_url,
    get_site_name,
    get_default_site,
    get_site_from_request_or_default,
    get_site_type,
    SITE_CHOICES,
    get_site_base_name,
    get_site_of_type,
    get_site_origin,
)


class SiteUtilsTests(TestCase):
    @override_settings(DEBUG=False)
    def test_absolute_reverse_works(self):
        self.assertEqual(absolute_reverse("batch-graphql"), "https://example.com/en/graphql")

    def test_absolutify_url_raises_error_on_non_absolute_paths(self):
        with self.assertRaises(ValueError):
            absolutify_url("meh")

    def test_absolutify_url_passes_through_http_urls(self):
        self.assertEqual(absolutify_url("http://foo"), "http://foo")

    def test_absolutify_url_passes_through_https_urls(self):
        self.assertEqual(absolutify_url("https://foo"), "https://foo")

    @override_settings(DEBUG=False)
    def test_absolutify_url_works_in_production(self):
        self.assertEqual(absolutify_url("/boop"), "https://example.com/boop")

    @override_settings(DEBUG=True)
    def test_absolutify_url_works_in_development(self):
        self.assertEqual(absolutify_url("/blap"), "http://example.com/blap")


def test_absolute_reverse_works_when_passed_in_request(db, rf):
    Site(domain="boop.com", name="Boopy site").save()
    req = rf.get("/", SERVER_NAME="boop.com")
    assert absolute_reverse("batch-graphql", request=req).startswith("https://boop.com/")


def test_absolutify_url_works_when_passed_in_request(db, rf):
    Site(domain="boop.com", name="Boopy site").save()
    req = rf.get("/", SERVER_NAME="boop.com")
    assert absolutify_url("/foo", request=req) == "https://boop.com/foo"


class TestGetDefaultSite:
    def test_it_works(self, db):
        assert get_default_site().name == "example.com"

    def test_it_works_when_default_site_id_is_not_1(self, db, settings):
        site = Site(domain="boop.com", name="Boopy site")
        site.save()
        settings.DEFAULT_SITE_ID = site.pk
        assert get_default_site().name == "Boopy site"


class TestGetSiteFromRequestOrDefault:
    def test_it_returns_default_site_when_request_is_none(self, db):
        assert get_site_from_request_or_default().name == "example.com"

    def test_it_returns_default_site_when_request_has_unrecognized_domain(self, rf, db):
        req = rf.get("/", SERVER_NAME="boop.com")
        assert get_site_from_request_or_default(req).name == "example.com"

    def test_it_returns_site_when_request_has_recognized_domain(self, rf, db):
        Site(domain="boop.com", name="Boopy site").save()
        req = rf.get("/", SERVER_NAME="boop.com")
        assert get_site_from_request_or_default(req).name == "Boopy site"


class TestGetSiteName:
    def test_it_works_when_deployment_name_is_undefined(self):
        assert get_site_name() == "JustFix.nyc"

    @override_settings(NAVBAR_LABEL="DEMO SITE")
    def test_it_works_when_deployment_name_is_defined(self):
        assert get_site_name() == "JustFix.nyc DEMO SITE"


class TestGetSiteOfType:
    def test_it_works(self, db):
        assert get_site_of_type(SITE_CHOICES.JUSTFIX).name == "example.com"

    def test_it_raises_error_when_site_not_found(self, db):
        with pytest.raises(ValueError, match="Unable to find site of type NORENT"):
            get_site_of_type(SITE_CHOICES.NORENT)


def test_get_site_origin_works(settings):
    site = Site(domain="boop.com")
    assert get_site_origin(site) == "https://boop.com"

    settings.DEBUG = True
    assert get_site_origin(site) == "http://boop.com"


@pytest.mark.parametrize(
    "name,expected",
    [
        ["example.com", SITE_CHOICES.JUSTFIX],
        ["justfix.nyc", SITE_CHOICES.JUSTFIX],
        ["my funky site", SITE_CHOICES.JUSTFIX],
        ["", SITE_CHOICES.JUSTFIX],
        ["norent.org", SITE_CHOICES.NORENT],
        ["NoRent.org", SITE_CHOICES.NORENT],
        ["my norent site", SITE_CHOICES.NORENT],
        ["EvictionFreeNY.org", SITE_CHOICES.EVICTIONFREE],
        ["LaLetterBuilder.org", SITE_CHOICES.LALETTERBUILDER],
    ],
)
def test_get_site_type_works(name, expected):
    site = Site(name=name, domain="example.com")
    assert get_site_type(site) == expected


@pytest.mark.parametrize(
    "name,expected",
    [
        [SITE_CHOICES.JUSTFIX, "JustFix.nyc"],
        [SITE_CHOICES.NORENT, "NoRent"],
    ],
)
def test_get_site_base_name_works(name, expected):
    assert get_site_base_name(name) == expected


def test_get_site_base_name_raises_error():
    with pytest.raises(ValueError):
        get_site_base_name("BOOP")
