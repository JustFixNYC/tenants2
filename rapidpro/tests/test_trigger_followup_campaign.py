from unittest.mock import MagicMock
from django.core.management import call_command, CommandError
import pytest

from rapidpro.followup_campaigns import DjangoSettingsFollowupCampaigns


@pytest.fixture(autouse=True)
def setup_fixture(settings):
    settings.RAPIDPRO_API_TOKEN = "boop"


def test_it_raises_error_if_campaign_is_invalid():
    with pytest.raises(CommandError, match="choose a valid follow-up campaign"):
        call_command("trigger_followup_campaign", "Boop Jones", "5551234567", "BLOOOP", "en")


def test_it_raises_error_if_campaign_is_unconfigured():
    with pytest.raises(CommandError, match="The RH campaign must be configured"):
        call_command("trigger_followup_campaign", "Boop Jones", "5551234567", "RH", "en")


def test_it_works(settings, monkeypatch):
    settings.RAPIDPRO_FOLLOWUP_CAMPAIGN_RH = "Boop Group,date_of_boop"
    get_campaign = MagicMock()
    campaign = MagicMock()
    get_campaign.return_value = campaign
    monkeypatch.setattr(DjangoSettingsFollowupCampaigns, "get_campaign", get_campaign)
    call_command("trigger_followup_campaign", "Boop Jones", "5551234567", "RH", "en")
    assert get_campaign.called_once_with("RH")
    assert campaign.add_contact.called_once()
    assert campaign.add_contact.call_args.args[1:] == ("Boop Jones", "5551234567", "en")
