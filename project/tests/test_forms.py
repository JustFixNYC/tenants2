import pytest
from unittest.mock import patch
from django.conf import settings
from django.forms import ValidationError

from project.forms import (
    LoginForm,
    OnboardingStep1Form,
    OnboardingStep4Form,
    USPhoneNumberField
)
from users.models import JustfixUser
from .test_geocoding import EXAMPLE_SEARCH


ADDRESS_FORM_DATA = {
    'address': '150 court',
    'borough': 'BROOKLYN'
}

STEP_4_FORM_DATA = {
    'phone_number': '555-123-4567',
    'can_we_sms': True,
    'password': 'iamasuperstrongpassword#@$reowN@#rokeNER',
    'confirm_password': 'iamasuperstrongpassword#@$reowN@#rokeNER'
}


@pytest.mark.django_db
def test_onboarding_step_4_form_works():
    form = OnboardingStep4Form(data=STEP_4_FORM_DATA)
    form.full_clean()
    assert form.errors == {}


@pytest.mark.django_db
def test_onboarding_step_4_form_fails_on_mismatched_passwords():
    form = OnboardingStep4Form(data={
        **STEP_4_FORM_DATA,
        'confirm_password': 'i do not match the password'
    })
    form.full_clean()
    assert form.errors == {
        '__all__': ['Passwords do not match!']
    }


@pytest.mark.django_db
def test_onboarding_step_4_form_requires_sms_permission():
    form = OnboardingStep4Form(data={
        **STEP_4_FORM_DATA,
        'can_we_sms': False
    })
    form.full_clean()
    assert form.errors == {'can_we_sms': ['This field is required.']}


@pytest.mark.django_db
def test_onboarding_step_4_form_fails_on_existing_phone_number():
    JustfixUser.objects.create_user(username='blah', phone_number='5551234567')
    form = OnboardingStep4Form(data=STEP_4_FORM_DATA)
    form.full_clean()
    assert form.errors == {
        'phone_number': ['A user with that phone number already exists.']
    }


@pytest.mark.django_db
def test_onboarding_step_4_form_validates_passwords():
    form = OnboardingStep4Form(data={
        **STEP_4_FORM_DATA,
        'password': 'test',
        'confirm_password': 'test'
    })
    form.full_clean()
    assert form.errors == {
        'password': [
            'This password is too short. It must contain at least 8 characters.',
            'This password is too common.'
        ]
    }


def test_onboarding_step_1_form_sets_address_to_geocoder_value(requests_mock):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_SEARCH)
    form = OnboardingStep1Form(data=ADDRESS_FORM_DATA)
    form.full_clean()
    assert form.cleaned_data['address'] == '150 COURT STREET'
    assert form.cleaned_data['address_verified'] is True


def test_onboarding_step_1_form_works_when_geocoder_is_unavailable(requests_mock):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, status_code=500)
    form = OnboardingStep1Form(data=ADDRESS_FORM_DATA)
    form.full_clean()
    assert form.cleaned_data['address'] == '150 court'
    assert form.cleaned_data['address_verified'] is False


def test_onboarding_step_1_form_raises_err_on_invalid_address(requests_mock):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, json={'features': []})
    form = OnboardingStep1Form(data=ADDRESS_FORM_DATA)
    form.full_clean()
    assert 'The address provided is invalid.' in form.errors['__all__']


def test_login_form_is_invalid_if_fields_are_invalid():
    assert LoginForm(data={'phone_number': '', 'password': ''}).is_valid() is False
    assert LoginForm(data={'phone_number': '', 'password': '123'}).is_valid() is False
    assert LoginForm(data={'phone_number': '5551234567', 'password': ''}).is_valid() is False


def test_login_form_is_invalid_if_auth_failed():
    with patch('project.forms.authenticate', return_value=None) as auth:
        form = LoginForm(data={'phone_number': '5551234567', 'password': 'boop'})
        assert form.is_valid() is False
        auth.assert_called_once_with(phone_number='5551234567', password='boop')
        assert form.errors == {
            '__all__': ['Invalid phone number or password.']
        }
        assert form.authenticated_user is None


def test_login_form_is_valid_if_auth_succeeded():
    fake_user = {'fake': 'user'}
    with patch('project.forms.authenticate', return_value=fake_user):
        form = LoginForm(data={'phone_number': '5551234567', 'password': 'boop'})
        assert form.is_valid() is True
        assert form.authenticated_user is fake_user


@pytest.mark.parametrize("phone_number", [
    '5551234567',
    '555-123-4567',
    '+1 555 123-4567'
])
def test_phone_number_field_works(phone_number):
    assert USPhoneNumberField().clean(phone_number) == '5551234567'


def test_phone_number_field_errors_on_really_long_input():
    with pytest.raises(ValidationError) as exc_info:
        USPhoneNumberField().clean('5551234567' * 30)
    assert 'Ensure this value has at most ' in str(exc_info.value)


@pytest.mark.parametrize("bad_phone_number", [
    '555123456',
    '555-123-456',
    '+2 555 123-4567'
])
def test_phone_number_field_raises_errors(bad_phone_number):
    with pytest.raises(ValidationError) as exc_info:
        USPhoneNumberField().clean(bad_phone_number)
    assert 'This does not look like a U.S. phone number.' in str(exc_info.value)
