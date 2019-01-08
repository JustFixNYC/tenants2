import pytest


@pytest.fixture(autouse=True)
def enable_twofactor(settings):
    # The default test settings disable 2FA, but since we're
    # testing the 2FA functionality itself, we'll enable it.
    settings.TWOFACTOR_VERIFY_DURATION = 60
