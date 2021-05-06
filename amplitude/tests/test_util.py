import pytest
from django.core.exceptions import ImproperlyConfigured

from amplitude.util import get_url_for_user_page
from users.tests.factories import UserFactory


SAMPLE_SETTINGS_URL = "https://analytics.amplitude.com/bop/settings/projects/342/general"


class TestGetUrlForUserPage:
    def test_it_returns_none_when_amplitude_is_not_configured(self):
        assert get_url_for_user_page(1) is None

    def test_it_returns_none_when_user_has_no_pk(self, settings):
        settings.AMPLITUDE_PROJECT_SETTINGS_URL = SAMPLE_SETTINGS_URL
        assert get_url_for_user_page(UserFactory.build()) is None

    def test_it_returns_url_when_user_has_pk(self, settings, db):
        settings.AMPLITUDE_PROJECT_SETTINGS_URL = SAMPLE_SETTINGS_URL
        user = UserFactory()
        assert (
            get_url_for_user_page(user)
            == f"https://analytics.amplitude.com/bop/project/342/search/user_id%3Djustfix:{user.pk}"
        )

    def test_it_returns_url_when_given_int(self, settings):
        settings.AMPLITUDE_PROJECT_SETTINGS_URL = SAMPLE_SETTINGS_URL
        assert (
            get_url_for_user_page(15)
            == "https://analytics.amplitude.com/bop/project/342/search/user_id%3Djustfix:15"
        )

    def test_it_raises_improperly_configured(self, settings):
        settings.AMPLITUDE_PROJECT_SETTINGS_URL = "boop"
        with pytest.raises(ImproperlyConfigured):
            get_url_for_user_page(15)
