import pytest
import datetime

from users.tests.factories import UserFactory
from onboarding.tests.factories import OnboardingInfoFactory
from loc.tests.factories import LetterRequestFactory, LandlordDetailsFactory
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
    assert fields.onboarding_info__lease_type == ''
    assert fields.letter_request__created_at is None
    assert fields.landlord_details__name == ''
    assert fields.landlord_details__address == ''
    assert fields.letter_request__will_we_mail is False


@pytest.mark.django_db
def test_from_user_works_with_onboarded_user():
    info = OnboardingInfoFactory(can_we_sms=True)
    fields = Fields.from_user(info.user)
    assert fields.onboarding_info__can_we_sms is True
    assert fields.onboarding_info__address_for_mailing == \
        "150 court street\nApartment 2\nBrooklyn, NY"
    assert fields.onboarding_info__lease_type == 'RENT_STABILIZED'

    info.can_we_sms = False
    info.save()
    fields = Fields.from_user(info.user)
    assert fields.onboarding_info__can_we_sms is False


@pytest.mark.django_db
def test_from_user_works_with_letter_request():
    lr = LetterRequestFactory()
    fields = Fields.from_user(lr.user)
    assert fields.letter_request__will_we_mail is True
    assert fields.letter_request__created_at == datetime.datetime.utcnow().date().isoformat()
    assert fields.letter_request__admin_pdf_url == \
        f'https://example.com/loc/admin/{lr.user.pk}/letter.pdf'


@pytest.mark.django_db
def test_from_user_works_with_landlord_details():
    ld = LandlordDetailsFactory()
    fields = Fields.from_user(ld.user)
    assert fields.landlord_details__name == 'Landlordo Calrissian'
    assert fields.landlord_details__address == '1 Cloud City'
