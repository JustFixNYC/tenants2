from users.models import JustfixUser
from project.util.email_attachment import get_slack_notify_text


class TestGetSlackNotifyText:
    def test_it_works_with_one_recipient(self, db):
        user = JustfixUser(first_name="Boop", pk=1)
        assert get_slack_notify_text(user, "a peanut", 1) == (
            "<https://example.com/admin/users/justfixuser/1/change/|Boop> emailed "
            "a peanut to 1 recipient!"
        )

    def test_it_works_with_many_recipients(self, db):
        user = JustfixUser(first_name="Boop", pk=1)
        assert get_slack_notify_text(user, "a peanut", 3) == (
            "<https://example.com/admin/users/justfixuser/1/change/|Boop> emailed "
            "a peanut to 3 recipients!"
        )
