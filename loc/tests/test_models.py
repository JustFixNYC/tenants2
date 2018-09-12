from datetime import date
import pytest

from users.tests.factories import UserFactory
from loc.models import AccessDate


@pytest.mark.django_db
def test_set_for_user_works():
    user = UserFactory.create()
    AccessDate.objects.set_for_user(user, [date(2010, 1, 1)])
    assert AccessDate.objects.get_for_user(user) == [date(2010, 1, 1)]

    AccessDate.objects.set_for_user(user, [date(2011, 2, 2)])
    assert AccessDate.objects.get_for_user(user) == [date(2011, 2, 2)]
