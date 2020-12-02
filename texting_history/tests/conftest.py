import json
from pathlib import Path
import pytest

MY_DIR = Path(__file__).parent.resolve()

FAKE_MESSAGE_RESPONSE_PATH = (MY_DIR / "fake_message_response.json").read_text()

FAKE_MESSAGE_RESPONSE = json.loads(FAKE_MESSAGE_RESPONSE_PATH)

EMPTY_MESSAGE_RESPONSE = json.loads(FAKE_MESSAGE_RESPONSE_PATH)
EMPTY_MESSAGE_RESPONSE["page_size"] = 0
EMPTY_MESSAGE_RESPONSE["messages"] = []


@pytest.fixture
def mock_twilio_api(requests_mock, settings):
    settings.TWILIO_ACCOUNT_SID = "boop"
    settings.TWILIO_AUTH_TOKEN = "sekret"
    settings.TWILIO_PHONE_NUMBER = "5551234567"
    requests_mock.get(
        "https://api.twilio.com/2010-04-01/Accounts/boop/Messages.json?To=%2B15551234567",
        json=FAKE_MESSAGE_RESPONSE,
    )
    requests_mock.get(
        "https://api.twilio.com/2010-04-01/Accounts/boop/Messages.json?From=%2B15551234567",
        json=EMPTY_MESSAGE_RESPONSE,
    )
