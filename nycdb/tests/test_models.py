from unittest.mock import patch
from django.db.utils import DatabaseError
import pytest

from nycdb.models import (
    HPDRegistration, HPDContact, Company, Individual, get_landlord,
    get_management_company, normalize_apartment)
from . import fixtures


class TestHPDRegistration:
    def test_get_landlord_returns_none_if_not_found(self, nycdb):
        reg = HPDRegistration()
        assert reg.get_landlord() is None

    def test_pad_bin_works(self):
        reg = HPDRegistration()
        assert reg.pad_bin == ''
        reg.bin = 1234567
        assert reg.pad_bin == '1234567'


@pytest.mark.parametrize('value,expected', [
    (" ", ""),
    ("", ""),
    (" 2", "#2"),
    ("10FLOOR", "FLOOR 10"),
    ("2FLOO", "FLOOR 2"),
    ("BSMNT", "BSMT"),
    ("BSMT", "BSMT"),
    ("APT1", "APT 1"),
    ("STE70", "STE 70"),
])
def test_normalize_apartment(value, expected):
    assert normalize_apartment(value) == expected


def test_tiny_landlord_works(nycdb):
    tiny = fixtures.load_hpd_registration("tiny-landlord.json")
    assert tiny.get_management_company() is None
    boop = tiny.get_landlord()
    assert isinstance(boop, Individual)
    assert boop.name == "BOOP JONES"
    assert boop.address.lines_for_mailing == [
        "124 99TH STREET",
        "Brooklyn, NY 11999"
    ]


def test_medium_landlord_works(nycdb):
    reg = fixtures.load_hpd_registration("medium-landlord.json")

    mgmtco = reg.get_management_company()
    assert isinstance(mgmtco, Company)
    assert mgmtco.name == "FUNKY APARTMENT MANAGEMENT"
    assert mgmtco.address.lines_for_mailing == [
        '900 EAST 25TH STREET #2',
        'NEW YORK, NY 10099'
    ]

    ll = reg.get_landlord()
    assert isinstance(ll, Company)
    assert ll.name == "LANDLORDO CALRISSIAN"
    assert ll.address.lines_for_mailing == [
        '9 BEAN CENTER DRIVE #40',
        'FUNKYPLACE, NJ 07099'
    ]


@pytest.mark.parametrize("model", [
    HPDRegistration,
    HPDContact,
])
def test_error_raised_when_nycdb_not_enabled(model):
    with pytest.raises(Exception, match='NYCDB integration is disabled'):
        model.objects.all()


class TestHPDContact:
    def test_full_name_works(self):
        assert HPDContact().full_name == ''
        assert HPDContact(firstname='a', lastname='b').full_name == "a b"
        assert HPDContact(firstname='a').full_name == "a"
        assert HPDContact(lastname='b').full_name == "b"

    def test_street_address_works(self):
        assert HPDContact().street_address == ''
        assert HPDContact(
            businesshousenumber='23',
            businessstreetname="blarg st"
        ).street_address == '23 blarg st'

    def test_address_is_none_if_all_fields_are_not_present(self):
        assert HPDContact().address is None
        assert HPDContact(businessstreetname="blarg st").address is None
        assert HPDContact(businesscity="new york").address is None


class TestGetLandlord:
    def test_it_returns_none_if_nycdb_is_disabled(self):
        assert get_landlord('') is None
        assert get_landlord('blarg') is None

    def test_it_returns_none_if_pad_bbl_does_not_exist(self, nycdb):
        assert get_landlord('1234567890') is None

    def test_it_returns_none_on_db_error(self, nycdb):
        with patch.object(HPDRegistration.objects, 'from_pad_bbl') as fpbblmock:
            fpbblmock.side_effect = DatabaseError()
            with patch('nycdb.models.logger.exception') as loggermock:
                assert get_landlord('1234567890') is None
                loggermock.assert_called_once_with(
                    f'Error while retrieving data from NYCDB')

    def test_it_returns_contact_of_pad_bbl_on_success(self, nycdb):
        tiny = fixtures.load_hpd_registration("tiny-landlord.json")
        boop = get_landlord(tiny.pad_bbl)
        assert isinstance(boop, Individual)
        assert boop.name == "BOOP JONES"

    def test_it_returns_contact_of_pad_bin_on_success(self, nycdb):
        tiny = fixtures.load_hpd_registration("tiny-landlord.json")
        boop = get_landlord('zzzzz', tiny.pad_bin)
        assert isinstance(boop, Individual)

    def test_it_falls_back_to_pad_bbl_if_pad_bin_fails(self, nycdb):
        tiny = fixtures.load_hpd_registration("tiny-landlord.json")
        boop = get_landlord(tiny.pad_bbl, '999')
        assert isinstance(boop, Individual)


class TestGetManagementCompany:
    def test_it_returns_none_if_nycdb_is_disabled(self):
        assert get_management_company('') is None

    def test_it_returns_none_if_pad_bbl_does_not_exist(self, nycdb):
        assert get_management_company('1234567890') is None

    def test_it_returns_none_on_db_error(self, nycdb):
        with patch.object(HPDRegistration.objects, 'from_pad_bbl') as fpbblmock:
            fpbblmock.side_effect = DatabaseError()
            with patch('nycdb.models.logger.exception') as loggermock:
                assert get_management_company('1234567890') is None
                loggermock.assert_called_once_with(
                    f'Error while retrieving data from NYCDB')

    def test_it_returns_company_on_success(self, nycdb):
        medium = fixtures.load_hpd_registration("medium-landlord.json")
        mgmtco = get_management_company(medium.pad_bbl)
        assert isinstance(mgmtco, Company)
        assert mgmtco.name == "FUNKY APARTMENT MANAGEMENT"
