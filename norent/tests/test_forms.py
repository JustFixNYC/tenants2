from norent.forms import CityState, RentPeriodsForm
from .factories import RentPeriodFactory

from project.tests.test_mapbox import mock_brooklyn_results


class TestRentPeriods:
    VALID = [
        ["2020-05-01"],
        ["2020-10-01"],
        ["2020-05-01", "2020-10-01"],
    ]

    INVALID = [
        ["2001-01-01"],
        ["boop"],
        ["2020-05-01", "boop"],
    ]

    def test_it_works(self, db):
        RentPeriodFactory.from_iso("2020-05-01")
        RentPeriodFactory.from_iso("2020-10-01")
        for valid in self.VALID:
            form = RentPeriodsForm(data={"rent_periods": valid})
            assert form.is_valid(), f"Rent period(s) {valid} is valid"
        for invalid in self.INVALID:
            form = RentPeriodsForm(data={"rent_periods": invalid})
            assert not form.is_valid(), f"Rent period(s) {invalid} is invalid"


class TestCityState:
    def test_it_works_when_nothing_is_filled(self):
        form = CityState(data={})
        assert not form.is_valid()
        assert form.cleaned_data == {}

    def test_it_does_not_modify_city_if_mapbox_is_disabled(self):
        form = CityState(data={"city": "broklyn", "state": "NY"})
        form.full_clean()
        assert form.is_valid()
        assert form.cleaned_data == {"city": "broklyn", "state": "NY"}

    def test_it_modifies_city_if_mapbox_is_enabled(self, requests_mock, settings):
        settings.MAPBOX_ACCESS_TOKEN = "blah"
        mock_brooklyn_results("broklyn, NY", requests_mock)
        form = CityState(data={"city": "broklyn", "state": "NY"})
        form.full_clean()
        assert form.is_valid()
        assert form.cleaned_data == {"city": "Brooklyn", "state": "NY"}

    def test_it_raises_err_if_mapbox_is_enabled(self, requests_mock, settings):
        settings.MAPBOX_ACCESS_TOKEN = "blah"
        mock_brooklyn_results("broklyn, GA", requests_mock)
        form = CityState(data={"city": "broklyn", "state": "GA"})
        form.full_clean()
        assert form.errors == {
            "__all__": ["broklyn, Georgia doesn't seem to exist!"],
        }
