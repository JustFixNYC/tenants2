from io import StringIO
from unittest.mock import MagicMock
import pytest
from django.core.management import call_command

from rapidpro.followup_campaigns import FollowupCampaign


def call():
    out = StringIO()
    call_command("validate_rapidpro_settings", stdout=out)
    return out.getvalue()


@pytest.fixture(autouse=True)
def setup_fixture(settings, monkeypatch):
    settings.RAPIDPRO_API_TOKEN = "boop"


def test_it_works_when_no_campaigns_are_configured():
    assert "Follow-up campaign RH is not configured" in call()


def test_it_validates_campaigns(settings, monkeypatch):
    settings.RAPIDPRO_FOLLOWUP_CAMPAIGN_RH = "Boop Group,date_of_boop"
    validate = MagicMock()
    monkeypatch.setattr(FollowupCampaign, "validate", validate)
    assert "Validating RH " in call()
    validate.assert_called_once()
