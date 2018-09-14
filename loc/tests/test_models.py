from datetime import date, datetime
import pytest

from users.tests.factories import UserFactory
from loc.models import AccessDate, LetterRequest


@pytest.mark.django_db
def test_set_for_user_works():
    user = UserFactory.create()
    AccessDate.objects.set_for_user(user, [date(2010, 1, 1)])
    assert AccessDate.objects.get_for_user(user) == [date(2010, 1, 1)]

    AccessDate.objects.set_for_user(user, [date(2011, 2, 2)])
    assert AccessDate.objects.get_for_user(user) == [date(2011, 2, 2)]


def test_letter_request_str_works_when_fields_are_not_set():
    info = LetterRequest()
    assert str(info) == 'LetterRequest object (None)'


def test_letter_request_str_works_when_fields_are_set():
    info = LetterRequest(user=UserFactory.build(), created_at=datetime(2018, 1, 2))
    assert str(info) == "Boop Jones's letter of complaint request from Tuesday, January 02 2018"
