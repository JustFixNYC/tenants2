from users.tests.factories import UserFactory

from .factories import UserContactGroupFactory
from rapidpro.models import get_group_names_for_user


class TestGetGroupNamesForUser:
    def test_it_returns_empty_list_when_given_unsaved_user(self):
        user = UserFactory.build()
        assert get_group_names_for_user(user) == []

    def test_it_works(self, db):
        ucg = UserContactGroupFactory(group__name="foo")
        assert get_group_names_for_user(ucg.user) == ["foo"]
