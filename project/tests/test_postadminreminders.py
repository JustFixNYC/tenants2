from io import StringIO
import freezegun
from django.core.management import call_command

from loc.tests.factories import LetterRequestFactory, SecondLetterRequestFactory


class TestPostAdminReminders:
    def test_it_posts_reminders_for_old_loc_requests(self, db):
        output = StringIO()
        with freezegun.freeze_time("2001-01-01"):
            LetterRequestFactory()
        call_command("postadminreminders", stdout=output)
        assert "Posting reminder to admins about sending letters of complaint" in output.getvalue()

    def test_it_includes_usernames_for_one_old_loc_request(self, db):
        output = StringIO()
        with freezegun.freeze_time("2001-01-01"):
            LetterRequestFactory()
        call_command("postadminreminders", stdout=output)
        assert (
            f"One user (<https://example.com/admin/users/justfixuser/2/change/|Bip>) has not had "
            f"their letter of complaint sent" in output.getvalue()
        )

    def test_it_includes_usernames_for_multiple_old_loc_requests(self, db):
        output = StringIO()
        with freezegun.freeze_time("2001-01-02"):
            LetterRequestFactory()
            SecondLetterRequestFactory()
        call_command("postadminreminders", stdout=output)
        assert (
            f"2 users, including <https://example.com/admin/users/justfixuser/3/change/|Bip>, "
            f"have not had their letters of complaint sent" in output.getvalue()
        )

    def test_it_ignores_new_loc_requests(self, db):
        output = StringIO()
        LetterRequestFactory()
        call_command("postadminreminders", stdout=output)
        assert "No reminders need to be posted" in output.getvalue()
