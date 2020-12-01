from pathlib import Path
from unittest.mock import patch
import pytest
from django.test import override_settings
from django.conf import settings
from django.core.management import call_command
from django.core.management.base import CommandError

from project.tests.test_geocoding import EXAMPLE_SEARCH as EXAMPLE_GEO_SEARCH
from project.tests.util import simplepatch
from loc.landlord_lookup import (
    lookup_landlord, LandlordInfo, _lookup_landlord_via_nycdb)


MY_DIR = Path(__file__).parent.resolve()

enable_fake_landlord_lookup = override_settings(
    GEOCODING_SEARCH_URL='http://localhost:12345/geo',
)

bypass_nycha_lookup = simplepatch(
    'nycha.models.NychaOffice.objects.find_for_property', return_value=None)


def mock_lookup_success(requests_mock, nycdb):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_GEO_SEARCH)

    # Urg, we have to give the registration the same BBL as the geo search
    # result.
    reg = nycdb.load_hpd_registration('tiny-landlord.json')
    reg.boroid = 3
    reg.block = 292
    reg.lot = 26
    reg.save()


def mock_lookup_failure(requests_mock):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_GEO_SEARCH)


def test_lookup_landlord_command_uses_nycha(db, loaded_nycha_csv_data):
    with patch('loc.landlord_lookup.lookup_bbl_and_bin_and_full_address',
               return_value=('3005380001', '', '453 COLUMBIA STREET, Brooklyn blahblahblah')):
        results = lookup_landlord('453 columbia st, Brooklyn')
        assert results.name == "RED HOOK EAST MANAGEMENT"
        assert results.address == "62 MILL STREET\nBROOKLYN, NY 11231"


@enable_fake_landlord_lookup
@bypass_nycha_lookup
def test_lookup_landlord_command_works(requests_mock, nycdb):
    mock_lookup_success(requests_mock, nycdb)
    call_command('lookup_landlord', '150 court, brooklyn')


@enable_fake_landlord_lookup
@bypass_nycha_lookup
def test_lookup_landlord_command_fails(requests_mock):
    with pytest.raises(CommandError):
        requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_GEO_SEARCH)
        call_command('lookup_landlord', '150 court, brooklyn')


def test_lookup_landlord_via_nycdb_works(nycdb):
    reg = nycdb.load_hpd_registration('tiny-landlord.json')
    ll = _lookup_landlord_via_nycdb(reg.pad_bbl, '')
    assert isinstance(ll, LandlordInfo)
    assert ll.name == "BOOP JONES"
    assert ll.address == "124 99TH STREET\nBrooklyn, NY 11999"
    assert ll.primary_line == "124 99TH STREET"
    assert ll.city == "Brooklyn"
    assert ll.state == "NY"
    assert ll.zip_code == "11999"


@enable_fake_landlord_lookup
@bypass_nycha_lookup
def test_lookup_landlord_returns_none_on_geocoding_500(requests_mock):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, status_code=500)
    assert lookup_landlord("150 court, brooklyn") is None


@enable_fake_landlord_lookup
@bypass_nycha_lookup
def test_lookup_landlord_returns_none_on_landlord_api_500(requests_mock):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_GEO_SEARCH)
    assert lookup_landlord("150 court, brooklyn") is None


@enable_fake_landlord_lookup
@bypass_nycha_lookup
def test_search_returns_none_on_request_exception(requests_mock):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_GEO_SEARCH)
    assert lookup_landlord("150 court, brooklyn") is None


@enable_fake_landlord_lookup
@bypass_nycha_lookup
def test_search_returns_none_on_bad_result(requests_mock):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_GEO_SEARCH)
    assert lookup_landlord("150 court, brooklyn") is None
