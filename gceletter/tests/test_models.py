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
        ud = SAMPLE_POST_DATA["user_details"]
        ld = SAMPLE_POST_DATA["landlord_details"]
        self.trigger.assert_called_once_with(
            f"{ud['first_name']} {ud['last_name']}",
            ud["phone_number"],
            letter.RAPIDPRO_CAMPAIGN,
            locale="en",
            custom_fields={
                "gce_letter_tracking_number": "fake_12345",
                "gce_letter_hash": letter.hash,
                "gce_letter_reason": SAMPLE_POST_DATA["reason"],
                "gce_letter_email_to_landlord": str(bool(ld["email"])).upper(),
                "gce_letter_mail_choice": SAMPLE_POST_DATA["mail_choice"],
                "gce_letter_landlord_name": ld["name"],
                "gce_letter_landlord_address": (
                    ld["primary_line"]
                    + (" " + ld["secondary_line"] if ld["secondary_line"] else "")
                    + f" {ld['city']}, {ld['state']} {ld['zip_code']}"
                ),
            },
        )
