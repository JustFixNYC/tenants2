from mailchimp.mailchimp import (
    get_email_hash,
    validate_settings,
    get_tag_for_source,
    SubscribeSource,
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
