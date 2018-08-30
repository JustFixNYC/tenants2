from unittest.mock import patch
from django.conf import settings

from project.forms import LoginForm, OnboardingStep1Form
from .test_geocoding import EXAMPLE_SEARCH


ADDRESS_FORM_DATA = {
    'address': '150 court',
    'borough': 'BROOKLYN'
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
