from django.contrib.auth.models import AnonymousUser

from users.models import JustfixUser
from rh.models import RentalHistoryRequest


class TestRentalHistoryRequest:
    def test_it_sets_user_to_none_if_user_is_anonymous(self):
        rhr = RentalHistoryRequest()
        rhr.set_user(AnonymousUser())
        assert rhr.user is None

    def test_it_sets_user_if_user_is_logged_in(self):
        rhr = RentalHistoryRequest()
        user = JustfixUser()
        rhr.set_user(user)
        assert rhr.user is user
