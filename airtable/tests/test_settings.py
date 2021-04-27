import pytest

from ..api import Airtable
from ..sync import AirtableSynchronizer


def configure_airtable_settings(settings, url="https://blarg", api_key="zzz"):
    settings.AIRTABLE_URL = url
    settings.AIRTABLE_API_KEY = api_key


def test_params_are_pulled_from_settings_by_default(settings):
    configure_airtable_settings(settings)
    airtables = [Airtable(), AirtableSynchronizer().airtable]
    for airtable in airtables:
        assert airtable.url == "https://blarg"
        assert airtable.api_key == "zzz"


def test_error_raised_if_settings_not_configured():
    for constructor in [Airtable, AirtableSynchronizer]:
        with pytest.raises(
            ValueError, match="Configuration not provided, and " "Django settings not configured"
        ):
            constructor()
