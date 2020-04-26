from norent.forms import CityState

from project.tests.test_mapbox import mock_brooklyn_results


class TestCityState:
    def test_it_works_when_nothing_is_filled(self):
        form = CityState(data={})
        assert not form.is_valid()
        assert form.cleaned_data == {}

    def test_it_does_not_modify_city_if_mapbox_is_disabled(self):
        form = CityState(data={'city': 'broklyn', 'state': 'NY'})
        form.full_clean()
        assert form.is_valid()
        assert form.cleaned_data == {'city': 'broklyn', 'state': 'NY'}

    def test_it_modifies_city_if_mapbox_is_enabled(self, requests_mock, settings):
        settings.MAPBOX_ACCESS_TOKEN = 'blah'
        mock_brooklyn_results('broklyn, NY', requests_mock)
        form = CityState(data={'city': 'broklyn', 'state': 'NY'})
        form.full_clean()
        assert form.is_valid()
        assert form.cleaned_data == {'city': 'Brooklyn', 'state': 'NY'}

    def test_it_raises_err_if_mapbox_is_enabled(self, requests_mock, settings):
        settings.MAPBOX_ACCESS_TOKEN = 'blah'
        mock_brooklyn_results('broklyn, GA', requests_mock)
        form = CityState(data={'city': 'broklyn', 'state': 'GA'})
        form.full_clean()
        assert form.errors == {
            '__all__': ["broklyn, Georgia doesn't seem to exist!"],
        }
