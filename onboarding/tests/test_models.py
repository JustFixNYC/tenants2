import datetime

from users.tests.factories import UserFactory
from onboarding.models import OnboardingInfo
from project.tests.test_geocoding import enable_fake_geocoding, EXAMPLE_SEARCH


def test_str_works_when_fields_are_not_set():
    info = OnboardingInfo()
    assert str(info) == 'OnboardingInfo object (None)'


def test_str_works_when_fields_are_set():
    info = OnboardingInfo(user=UserFactory.build(),
                          created_at=datetime.datetime(2018, 1, 2))
    assert str(info) == "Boop Jones's onboarding info from Tuesday, January 02 2018"


def test_borough_label_works():
    info = OnboardingInfo()
    assert info.borough_label == ''

    info.borough = 'STATEN_ISLAND'
    assert info.borough_label == 'Staten Island'

    info.borough = 'MANHATTAN'
    assert info.borough_label == 'Manhattan'


def test_city_works():
    info = OnboardingInfo()
    assert info.city == ''

    info.borough = 'STATEN_ISLAND'
    assert info.city == 'Staten Island'

    info.borough = 'MANHATTAN'
    assert info.city == 'New York'


def test_full_address_works():
    info = OnboardingInfo()
    assert info.full_address == ''

    info.borough = 'STATEN_ISLAND'
    assert info.full_address == ''

    info.address = '123 Boop street'
    assert info.full_address == '123 Boop street, Staten Island'


def test_address_lines_for_mailing():
    info = OnboardingInfo()
    assert info.address_lines_for_mailing == []

    info.address = "150 Boop Way"
    assert info.address_lines_for_mailing == ["150 Boop Way"]

    info.apt_number = "2"
    assert info.address_lines_for_mailing == ["150 Boop Way", "Apartment 2"]

    info.borough = "MANHATTAN"
    assert info.address_lines_for_mailing == ["150 Boop Way", "Apartment 2", "New York, NY"]

    info.zipcode = "11201"
    assert info.address_lines_for_mailing == ["150 Boop Way", "Apartment 2", "New York, NY 11201"]


class TestAddrMetadataLookup:
    def mkinfo(self, **kwargs):
        return OnboardingInfo(
            address='150 court street',
            borough='BROOKLYN',
            **kwargs
        )

    def mkinfo_without_metadata(self):
        return self.mkinfo()

    def mkinfo_with_metadata(self):
        return self.mkinfo(zipcode='11231', pad_bbl='2002920026', pad_bin='1000000')

    def test_no_lookup_when_full_address_is_empty(self):
        assert OnboardingInfo().maybe_lookup_new_addr_metadata() is False

    def test_no_lookup_when_addr_and_metadata_have_changed(self):
        info = self.mkinfo_with_metadata()
        info.address = '120 zzz street'
        info.zipcode = '12345'
        info.pad_bbl = '4002920026'
        info.pad_bin = '4000000'
        assert info.maybe_lookup_new_addr_metadata() is False

    def test_no_lookup_when_metadata_exists_and_nothing_changed(self):
        info = self.mkinfo_with_metadata()
        assert info.maybe_lookup_new_addr_metadata() is False

    def test_lookup_when_addr_is_same_but_metadata_is_empty(self):
        info = self.mkinfo_without_metadata()
        assert info.maybe_lookup_new_addr_metadata() is True

    def test_lookup_when_addr_changes_and_geocoding_fails(self):
        info = self.mkinfo_with_metadata()
        info.address = 'times square'
        assert info.maybe_lookup_new_addr_metadata() is True
        assert info.zipcode == ''
        assert info.pad_bbl == ''
        assert info.pad_bin == ''

        # Because geocoding failed, we should always try looking up
        # new metadata, in case geocoding works next time.
        assert info.maybe_lookup_new_addr_metadata() is True

    @enable_fake_geocoding
    def test_lookup_when_addr_changes_and_geocoding_works(self, requests_mock, settings):
        info = self.mkinfo_with_metadata()
        info.address = 'times square'
        requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_SEARCH)
        assert info.maybe_lookup_new_addr_metadata() is True

        # Make sure we "remember" that our metadata is associated with
        # our new address, i.e. we don't think we need to look it up again.
        assert info.maybe_lookup_new_addr_metadata() is False

    def test_lookup_when_borough_changes(self):
        info = self.mkinfo_with_metadata()
        info.borough = 'MANHATTAN'
        assert info.maybe_lookup_new_addr_metadata() is True

    @enable_fake_geocoding
    def test_successful_lookup_is_applied_to_model(self, requests_mock, settings):
        requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_SEARCH)
        info = self.mkinfo_without_metadata()
        assert info.maybe_lookup_new_addr_metadata() is True
        assert info.zipcode == '11201'
        assert info.pad_bbl == '3002920026'
        assert info.pad_bin == '3003069'
