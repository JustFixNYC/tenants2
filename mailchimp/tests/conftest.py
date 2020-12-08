import pytest


@pytest.fixture
def mailchimp(settings):
    "A fixture to simulate the enabling of Mailchimp integration."

    settings.MAILCHIMP_API_KEY = ("f" * 32) + "-us10"
    settings.MAILCHIMP_CORS_ORIGINS = ["https://www.justfix.nyc"]
    settings.MAILCHIMP_LIST_ID = "1234"
