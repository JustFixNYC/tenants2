import pytest

from mailchimp.mailchimp import (
    get_email_hash,
    validate_settings,
    get_tag_for_source,
    is_fake_email_err,
    SubscribeSource,
    MailChimpError,
)


class TestGetEmailHash:
    def test_it_ignores_case(self):
        assert get_email_hash("boop@jones.com") == get_email_hash("BOOP@JONES.COM")

    def test_it_works(self):
        assert get_email_hash("boop@jones.com") == "267a97babeaa2810f2c99246ee580d0e"


class TestValidateSettings:
    def test_it_works_when_mailchimp_is_disabled(self):
        validate_settings()

    def test_it_works_when_mailchimp_is_enabled(self, mailchimp):
        validate_settings()


def test_source_labels_are_exhaustive():
    for item in SubscribeSource:
        assert get_tag_for_source(item)


FAKE_EMAIL_ERR = {
    "type": "http://developer.mailchimp.com/documentation/mailchimp/guides/error-glossary/",
    "title": "Invalid Resource",
    "status": 400,
    "detail": "foo@example.com looks fake or invalid, please enter a real email address.",
    "instance": "bdae75e6-64e2-4e29-a866-cb168ba731ce",
}


@pytest.mark.parametrize(
    "blob,expected",
    [
        [{"blah": 1}, False],
        [FAKE_EMAIL_ERR, True],
    ],
)
def test_is_fake_email_err_works(blob, expected):
    assert is_fake_email_err(MailChimpError(blob)) is expected
