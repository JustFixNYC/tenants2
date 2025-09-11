import pytest
from typing import Tuple
from unittest.mock import MagicMock
from gceletter.util import GCELetterPostData
from gceletter.models import GCELetter, LandlordDetails, UserDetails
from gceletter.tests.sample_data import SAMPLE_POST_DATA


def create_model_objects(post_data) -> Tuple[GCELetter, LandlordDetails, UserDetails]:
    data = GCELetterPostData(**post_data)

    letter_data = data.to_dict(exclude=["user_details", "landlord_details"])
    letter = GCELetter.objects.create(**letter_data)

    landlord_data = {**data.landlord_details.to_dict(), "letter": letter}
    ld = LandlordDetails.objects.create(**landlord_data)

    user_data = {**data.user_details.to_dict(), "letter": letter}
    ud = UserDetails.objects.create(**user_data)

    return letter, ud, ld


class TestTriggerFollowupCampaign:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, monkeypatch):
        from rapidpro import followup_campaigns

        self.trigger = MagicMock()
        monkeypatch.setattr(followup_campaigns, "trigger_followup_campaign_async", self.trigger)

    def test_it_triggers_followup_campaign_with_tracking_number(self, db):
        letter, _, _ = create_model_objects(SAMPLE_POST_DATA)
        letter.tracking_number = "fake_12345"
        letter.trigger_followup_campaign_async()
        self.trigger.assert_called_once_with(
            f"{SAMPLE_POST_DATA['user_details']['first_name']} {SAMPLE_POST_DATA['user_details']['last_name']}",
            SAMPLE_POST_DATA["user_details"]["phone_number"],
            letter.RAPIDPRO_CAMPAIGN,
            locale="en",
            custom_fields={"gce_letter_tracking_number": "fake_12345"},
        )
