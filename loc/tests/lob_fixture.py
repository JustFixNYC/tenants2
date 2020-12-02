from pathlib import Path
from copy import deepcopy
import json

MY_DIR = Path(__file__).parent.resolve()

LOB_LETTERS_URL = "https://api.lob.com/v1/letters"

LOB_VERIFICATIONS_URL = "https://api.lob.com/v1/us_verifications"

LETTER_JSON = MY_DIR / "lob_letter.json"

VERIFICATION_JSON = MY_DIR / "lob_verification.json"

SAMPLE_LETTER = json.loads(LETTER_JSON.read_text())

SAMPLE_VERIFICATION = json.loads(VERIFICATION_JSON.read_text())


class MockLob:
    """
    A mock for the Lob API which enables Lob integration and
    configures Lob's API calls to respond with common defaults.
    """

    def __init__(self, settings, requests_mock):
        self.settings = settings
        self.requests_mock = requests_mock
        self.sample_letter = SAMPLE_LETTER
        self.sample_verification = SAMPLE_VERIFICATION
        self.settings.LOB_PUBLISHABLE_API_KEY = "mypubkey"
        self.settings.LOB_SECRET_API_KEY = "myseckey"
        self.mock_letters_api()
        self.mock_verifications_api()

    def mock_verifications_api(self, json=None, status_code=200):
        if json is None:
            json = self.sample_verification
        self.verifications_mock = self.requests_mock.post(
            LOB_VERIFICATIONS_URL,
            json=json,
            status_code=status_code,
        )

    def mock_letters_api(self, json=None, status_code=200):
        if json is None:
            json = self.sample_letter
        self.letters_mock = self.requests_mock.post(
            LOB_LETTERS_URL,
            json=json,
            status_code=status_code,
        )

    def get_sample_verification(self, **updates):
        return get_sample_verification(**updates)


def mocklob(settings, requests_mock):
    """
    Enable Lob integration and provide mocks to simulate Lob functionality.
    """

    yield MockLob(settings, requests_mock)


def get_sample_verification(**updates):
    result = deepcopy(SAMPLE_VERIFICATION)
    result.update(updates)
    return result
