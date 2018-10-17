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


def test_full_address_works():
    info = OnboardingInfo()
    assert info.full_address == ''

    info.borough = 'STATEN_ISLAND'
    assert info.full_address == ''

    info.address = '123 Boop street'
    assert info.full_address == '123 Boop street, Staten Island'


class TestAddrMetadataLookup:
    def mkinfo(self, **kwargs):
        return OnboardingInfo(
            address='150 boop street',
            borough='STATEN_ISLAND',
            **kwargs
        )

    def mkinfo_without_metadata(self):
        return self.mkinfo()

    def mkinfo_with_metadata(self):
        return self.mkinfo(zipcode='11231')

    def test_no_lookup_when_full_address_is_empty(self):
        assert OnboardingInfo().maybe_lookup_new_addr_metadata() is False

    def test_no_lookup_when_addr_and_metadata_have_changed(self):
        info = self.mkinfo_with_metadata()
        info.address = '120 zzz street'
        info.zipcode = '12345'
        assert info.maybe_lookup_new_addr_metadata() is False

    def test_no_lookup_when_metadata_exists_and_nothing_changed(self):
        info = self.mkinfo_with_metadata()
        assert info.maybe_lookup_new_addr_metadata() is False

    def test_lookup_when_addr_is_same_but_metadata_is_empty(self):
        info = self.mkinfo_without_metadata()
        assert info.maybe_lookup_new_addr_metadata() is True

    def test_lookup_when_addr_changes(self):
        info = self.mkinfo_with_metadata()
        info.address = 'times square'
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
