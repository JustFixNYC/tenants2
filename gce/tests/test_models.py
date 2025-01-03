import pytest
from unittest.mock import patch, MagicMock
from gce.models import GoodCauseEvictionScreenerResponse


class TestTriggerFollowupCampaign:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, monkeypatch):
        from rapidpro import followup_campaigns

        self.trigger = MagicMock()
        monkeypatch.setattr(followup_campaigns, "trigger_followup_campaign_async", self.trigger)

    def test_it_triggers_followup_campaign_if_user_has_phone_number(self, db):
        gcer = GoodCauseEvictionScreenerResponse(bbl="1234567890", phone_number="2125551234")
        gcer.trigger_followup_campaign_async()
        self.trigger.assert_called_once_with(None, "2125551234", "GCE", locale="en")
