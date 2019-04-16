from users.tests.factories import UserFactory
from django.utils.timezone import now

from rapidpro.models import get_group_names_for_user, UserContactGroup, ContactGroup


class TestGetGroupNamesForUser:
    def test_it_returns_empty_list_when_given_unsaved_user(self):
        user = UserFactory.build()
        assert get_group_names_for_user(user) == []

    def test_it_works(self, db):
        user = UserFactory()
        group = ContactGroup(uuid='blah', name='foo')
        group.save()
        ucg = UserContactGroup(user=user, group=group, earliest_known_date=now())
        ucg.save()
        assert get_group_names_for_user(user) == ['foo']
