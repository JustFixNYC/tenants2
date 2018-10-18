import pytest
import datetime

from users.tests.factories import UserFactory
from onboarding.tests.factories import OnboardingInfoFactory
from loc.tests.factories import LetterRequestFactory
from airtable.record import Fields


@pytest.mark.django_db
def test_from_user_works_with_minimal_user():
    user = UserFactory(
        phone_number='5551234567',
        full_name='Bobby Denver'
    )
    fields = Fields.from_user(user)
    assert fields.pk == user.pk
    assert fields.first_name == 'Bobby'
    assert fields.last_name == 'Denver'
    assert fields.admin_url == f'https://example.com/admin/users/justfixuser/{user.pk}/change/'
    assert fields.phone_number == '5551234567'
    assert fields.onboarding_info__can_we_sms is False
    assert fields.letter_request__created_at == ''


@pytest.mark.django_db
def test_from_user_works_with_onboarded_user():
    info = OnboardingInfoFactory(can_we_sms=True)
    fields = Fields.from_user(info.user)
    assert fields.onboarding_info__can_we_sms is True

    info.can_we_sms = False
    info.save()
    fields = Fields.from_user(info.user)
    assert fields.onboarding_info__can_we_sms is False


@pytest.mark.django_db
def test_from_user_works_with_letter_request():
    lr = LetterRequestFactory()
    fields = Fields.from_user(lr.user)
    assert fields.letter_request__created_at == datetime.date.today().isoformat()
