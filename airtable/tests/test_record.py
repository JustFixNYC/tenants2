import pytest
import datetime
from freezegun import freeze_time
from django.utils.timezone import make_aware

from users.tests.factories import UserFactory
from onboarding.tests.factories import OnboardingInfoFactory
from project.tests.util import strip_locale
from loc.tests.factories import LetterRequestFactory, LandlordDetailsFactory
from hpaction.tests.factories import HPActionDocumentsFactory, HPActionDetailsFactory
from airtable.record import Fields, apply_annotations_to_user


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
    assert fields.letter_request__letter_sent_at is None
    assert fields.letter_request__rejection_reason == ''
    assert fields.letter_request__tracking_number == ''
    assert fields.hp_latest_documents_date is None
    assert fields.hp_action_details__sue_for_repairs is False
    assert fields.hp_action_details__sue_for_harassment is False


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
    lr = LetterRequestFactory(
        letter_sent_at=make_aware(datetime.datetime(2018, 5, 6)),
        rejection_reason='INCRIMINATING',
        tracking_number='boop'
    )
    fields = Fields.from_user(lr.user)
    assert fields.letter_request__will_we_mail is True
    assert fields.letter_request__created_at == datetime.datetime.utcnow().date().isoformat()
    assert strip_locale(fields.letter_request__admin_pdf_url) == \
        f'https://example.com/loc/admin/{lr.user.pk}/letter.pdf'
    assert fields.letter_request__letter_sent_at == '2018-05-06'
    assert fields.letter_request__rejection_reason == 'INCRIMINATING'
    assert fields.letter_request__tracking_number == 'boop'


@pytest.mark.django_db
def test_from_user_works_with_landlord_details():
    ld = LandlordDetailsFactory()
    fields = Fields.from_user(ld.user)
    assert fields.landlord_details__name == 'Landlordo Calrissian'
    assert fields.landlord_details__address == '1 Cloud City'


@pytest.mark.django_db
def test_from_user_works_with_hp_action(django_file_storage):
    details = HPActionDetailsFactory(sue_for_repairs=True, sue_for_harassment=True)
    with freeze_time('2018-03-04'):
        HPActionDocumentsFactory(user=details.user)
    fields = Fields.from_user(details.user)
    assert fields.hp_latest_documents_date == '2018-03-04'
    assert fields.hp_action_details__sue_for_repairs is True
    assert fields.hp_action_details__sue_for_harassment is True


@pytest.mark.django_db
def test_from_user_works_with_partial_hp_action():
    details = HPActionDetailsFactory(sue_for_repairs=True, sue_for_harassment=True)
    fields = Fields.from_user(details.user)
    assert fields.hp_latest_documents_date is None
    assert fields.hp_action_details__sue_for_repairs is True
    assert fields.hp_action_details__sue_for_harassment is True


class TestApplyAnnotationsToUser:
    def test_it_does_nothing_if_annotations_exist(self):
        u = UserFactory.build()
        setattr(u, 'boop', 1)
        apply_annotations_to_user(u, {'boop': 'this value should never be used'})

    def test_it_applies_annotations_if_they_do_not_exist(self, db):
        from django.db.models import F
        from django.db.models.functions import Upper

        u = UserFactory(first_name='hallo')
        apply_annotations_to_user(u, {'boop': Upper(F('first_name'))})
        assert u.boop == 'HALLO'
