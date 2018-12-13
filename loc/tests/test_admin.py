import pytest

from users.models import JustfixUser
from users.tests.factories import UserFactory
from loc.admin import LetterRequestInline, print_loc_envelopes
from loc.models import LetterRequest


def test_loc_actions_shows_text_when_user_has_no_letter_request():
    lr = LetterRequest()
    assert LetterRequestInline.loc_actions(None, lr) == (
        'This user has not yet completed the letter of complaint process.'
    )


@pytest.mark.django_db
def test_loc_actions_shows_pdf_link_when_user_has_letter_request():
    user = UserFactory()
    lr = LetterRequest(user=user)
    lr.save()
    assert f'/loc/admin/{user.pk}/letter.pdf' in LetterRequestInline.loc_actions(None, lr)


@pytest.mark.django_db
def test_print_loc_envelopes_works():
    user = UserFactory()
    redirect = print_loc_envelopes(None, None, JustfixUser.objects.all())
    assert redirect.url == f'/loc/admin/envelopes.pdf?user_ids={user.pk}'
