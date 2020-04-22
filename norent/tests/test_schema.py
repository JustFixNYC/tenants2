import pytest
from django.contrib.auth.models import AnonymousUser
from django.contrib.sites.models import Site

from users.models import JustfixUser
from users.tests.factories import SecondUserFactory, UserFactory
from project.schema_base import update_last_queried_phone_number, PhoneNumberAccountStatus
from onboarding.tests.test_schema import _exec_onboarding_step_n
from onboarding.tests.factories import OnboardingInfoFactory
from .factories import RentPeriodFactory, LetterFactory
from loc.tests import test_lob_api
from norent.schema import update_scaffolding
from norent.models import Letter


@pytest.fixture
def use_norent_site(db):
    site = Site.objects.get(pk=1)
    site.name = "NoRent.org"
    site.save()


def one_field_err(message: str):
    return [{'field': '__all__', 'messages': [message]}]


def test_scaffolding_is_null_when_it_does_not_exist(graphql_client):
    result = graphql_client.execute(
        '''
        query {
          session {
            norentScaffolding {
              firstName
            }
          }
        }
        '''
    )['data']['session']['norentScaffolding']
    assert result is None


@pytest.mark.parametrize('city,state,expected', [
    ('', '', None),
    ('Ithaca', 'NY', False),
    ('STATEN ISLAND', 'NY', True),
    ('Brooklyn', 'NY', True),
    ('Brooklyn', 'AZ', False),
    ('Columbus', 'OH', False),
])
def test_is_city_in_nyc_works(graphql_client, city, state, expected):
    update_scaffolding(graphql_client.request, {
        'city': city,
        'state': state
    })

    actual = graphql_client.execute(
        '''
        query { session { norentScaffolding { isCityInNyc } } }
        '''
    )['data']['session']['norentScaffolding']['isCityInNyc']

    assert actual is expected


def test_email_mutation_updates_session(db, graphql_client):
    output = graphql_client.execute(
        '''
        mutation {
          output: norentEmail(input: {
            email: "blarf@blarg.com",
        }) {
            errors { field, messages }
            session {
              norentScaffolding { email }
            }
          }
        }
        '''
    )['data']['output']
    assert output['errors'] == []
    assert output['session']['norentScaffolding'] == {
        'email': 'blarf@blarg.com',
    }


def test_national_address_mutation_updates_session(graphql_client):
    output = graphql_client.execute(
        '''
        mutation {
          output: norentNationalAddress(input: {
            street: "boing",
            zipCode: "43569",
            aptNumber: "2",
        }) {
            errors { field, messages }
            session {
              norentScaffolding { street, zipCode, aptNumber }
            }
          }
        }
        '''
    )['data']['output']
    assert output['errors'] == []
    assert output['session']['norentScaffolding'] == {
        'street': 'boing',
        'zipCode': '43569',
        'aptNumber': '2',
    }


def test_city_state_mutation_updates_session(graphql_client):
    output = graphql_client.execute(
        '''
        mutation {
          output: norentCityState(input: {
            city: "oof",
            state: "OH",
        }) {
            errors { field, messages }
            session {
              norentScaffolding { city, state }
            }
          }
        }
        '''
    )['data']['output']
    assert output['errors'] == []
    assert output['session']['norentScaffolding'] == {
        'city': 'oof',
        'state': 'OH',
    }


def test_full_name_mutation_updates_session(graphql_client):
    output = graphql_client.execute(
        '''
        mutation {
          output: norentFullName(input: {
            firstName: "boeop",
            lastName: "blap",
        }) {
            errors { field, messages }
            session {
              norentScaffolding { firstName, lastName }
            }
          }
        }
        '''
    )['data']['output']
    assert output['errors'] == []
    assert output['session']['norentScaffolding'] == {
        'firstName': 'boeop',
        'lastName': 'blap',
    }


def test_landlord_info_mutation_updates_session(graphql_client):
    output = graphql_client.execute(
        '''
        mutation {
          output: norentLandlordInfo(input: {
            landlordName: "Landlordo Calrissian",
            landlordPrimaryLine: "1 Cloud City Drive",
            landlordCity: "Bespin",
            landlordState: "OH",
            landlordZipCode: "43569",
            landlordEmail: "boop@jones.com",
            landlordPhoneNumber: "5551234567"
        }) {
            errors { field, messages }
            session {
              norentScaffolding { landlordName }
            }
          }
        }
        '''
    )['data']['output']
    assert output['errors'] == []
    assert output['session']['norentScaffolding'] == {
        'landlordName': 'Landlordo Calrissian'
    }


class TestNorentCreateAccount:
    INCOMPLETE_ERR = [{
        'field': '__all__',
        'messages': ["You haven't completed all the previous steps yet."]
    }]

    NYC_SCAFFOLDING = {
        'first_name': 'zlorp',
        'last_name': 'zones',
        'city': 'New York City',
        'state': 'NY',
        'email': 'zlorp@zones.com',
    }

    NATIONAL_SCAFFOLDING = {
        'first_name': 'boop',
        'last_name': 'jones',
        'city': 'Columbus',
        'state': 'OH',
        'email': 'boop@jones.com',
        'street': '1200 Bingy Bingy Way',
        'apt_number': '5A',
        'zip_code': '43120',
    }

    @pytest.fixture(autouse=True)
    def setup_fixture(self, db, graphql_client):
        self.graphql_client = graphql_client

    def execute(self):
        input = {
            'password': 'blarg1234',
            'confirmPassword': 'blarg1234',
            'agreeToTerms': True,
            'canWeSms': True,
        }

        return self.graphql_client.execute(
            '''
            mutation Create($input: NorentCreateAccountInput!) {
                output: norentCreateAccount(input: $input) {
                    errors { field, messages }
                    session {
                        firstName
                    }
                }
            }
            ''',
            variables={'input': input}
        )['data']['output']

    def populate_phone_number(self):
        update_last_queried_phone_number(
            self.graphql_client.request,
            '5551234567',
            PhoneNumberAccountStatus.NO_ACCOUNT
        )

    def test_it_returns_error_when_session_is_empty(self):
        assert self.execute()['errors'] == self.INCOMPLETE_ERR

    def test_it_returns_error_when_only_phone_number_is_in_session(self):
        self.populate_phone_number()
        assert self.execute()['errors'] == self.INCOMPLETE_ERR

    def test_it_returns_error_when_nyc_addr_but_onboarding_step_1_empty(self):
        self.populate_phone_number()
        update_scaffolding(self.graphql_client.request, self.NYC_SCAFFOLDING)
        assert self.execute()['errors'] == self.INCOMPLETE_ERR

    def test_it_returns_error_when_national_addr_but_incomplete_scaffolding(self):
        self.populate_phone_number()
        scaff = {**self.NATIONAL_SCAFFOLDING, 'street': ''}
        update_scaffolding(self.graphql_client.request, scaff)
        assert self.execute()['errors'] == self.INCOMPLETE_ERR

    def test_it_returns_error_when_national_addr_but_no_phone_number(self):
        update_scaffolding(self.graphql_client.request, self.NATIONAL_SCAFFOLDING)
        assert self.execute()['errors'] == self.INCOMPLETE_ERR

    def test_it_works_for_national_users(self):
        request = self.graphql_client.request
        self.populate_phone_number()
        update_scaffolding(request, self.NATIONAL_SCAFFOLDING)
        assert self.execute()['errors'] == []
        user = JustfixUser.objects.get(phone_number='5551234567')
        assert user.first_name == 'boop'
        assert user.last_name == 'jones'
        assert user.email == 'boop@jones.com'
        oi = user.onboarding_info
        assert oi.non_nyc_city == 'Columbus'
        assert oi.borough == ''
        assert oi.state == 'OH'
        assert oi.zipcode == '43120'
        assert oi.address == '1200 Bingy Bingy Way'
        assert oi.apt_number == '5A'

    def test_it_works_for_nyc_users(self):
        request = self.graphql_client.request
        self.populate_phone_number()
        res = _exec_onboarding_step_n(1, self.graphql_client)
        assert res['errors'] == []
        update_scaffolding(request, self.NYC_SCAFFOLDING)
        assert self.execute()['errors'] == []
        user = JustfixUser.objects.get(phone_number='5551234567')
        assert user.first_name == 'zlorp'
        assert user.last_name == 'zones'
        assert user.email == 'zlorp@zones.com'
        oi = user.onboarding_info
        assert oi.non_nyc_city == ''
        assert oi.borough == 'MANHATTAN'
        assert oi.state == 'NY'
        assert oi.address == '123 boop way'
        assert oi.apt_number == '3B'

        # This will only get filled out if geocoding is enabled, which it's not.
        assert oi.zipcode == ''


class TestNorentLandlordNameAndContactTypes:
    def test_it_requires_at_least_one_checkbox(self, db, graphql_client):
        graphql_client.request.user = UserFactory()
        res = graphql_client.execute(
            '''
            mutation {
                output: norentLandlordNameAndContactTypes(input: {
                    name: "Bleh",
                    hasEmailAddress: false,
                    hasMailingAddress: false
                }) {
                    errors { field, messages }
                }
            }
            '''
        )['data']['output']
        assert res['errors'] == one_field_err('Please choose at least one option.')

    def test_it_works(self, db, graphql_client):
        graphql_client.request.user = UserFactory()
        res = graphql_client.execute(
            '''
            mutation {
                output: norentLandlordNameAndContactTypes(input: {
                    name: "Bleh",
                    hasEmailAddress: true,
                    hasMailingAddress: false
                }) {
                    errors { field, messages }
                    session {
                        landlordDetails { name }
                        norentScaffolding {
                            hasLandlordEmailAddress,
                            hasLandlordMailingAddress
                        }
                    }
                }
            }
            '''
        )['data']['output']
        assert res['errors'] == []
        assert res['session'] == {
           'landlordDetails': {'name': 'Bleh'},
           'norentScaffolding': {'hasLandlordEmailAddress': True,
                                 'hasLandlordMailingAddress': False}
        }


class TestNorentLatestRentPeriod:
    def test_it_returns_none_when_no_periods_exist(self, db, graphql_client):
        res = graphql_client.execute(
            'query { session { norentLatestRentPeriod { paymentDate} } }')
        assert res['data']['session']['norentLatestRentPeriod'] is None

    def test_it_returns_period(self, db, graphql_client):
        RentPeriodFactory()
        res = graphql_client.execute(
            'query { session { norentLatestRentPeriod { paymentDate } } }')
        assert res['data']['session']['norentLatestRentPeriod']['paymentDate'] == "2020-05-01"


class TestNorentLatestLetter:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, graphql_client, db):
        self.letter = LetterFactory(tracking_number='abcd')
        self.graphql_client = graphql_client

    def execute(self):
        res = self.graphql_client.execute(
            'query { session { norentLatestLetter { paymentDate } } }')
        return res['data']['session']['norentLatestLetter']

    def test_it_returns_none_if_not_logged_in(self):
        assert self.execute() is None

    def test_it_returns_none_if_no_letters_exist_for_user(self):
        self.graphql_client.request.user = SecondUserFactory()
        assert self.execute() is None

    def test_it_returns_letter_if_one_exists_for_user(self):
        self.graphql_client.request.user = self.letter.user
        assert self.execute()['paymentDate'] == '2020-05-01'


class TestNorentSendLetter:
    QUERY = '''
    mutation {
        norentSendLetter(input: {}) {
            errors { field, messages }
        }
    }
    '''

    @pytest.fixture(autouse=True)
    def setup_fixture(self, graphql_client, db):
        self.user = UserFactory()
        graphql_client.request.user = self.user
        self.graphql_client = graphql_client

    def create_landlord_details(self):
        update_scaffolding(self.graphql_client.request, {
            'landlord_name': 'Landlordo Calrissian',
            'landlord_primary_line': '2 Cloud City Place',
            'landlord_city': 'Bespin',
            'landlord_state': 'OH',
            'landlord_zip_code': '43216',
            'landlord_email': 'landlordo@calrissian.net',
        })

    def execute(self):
        res = self.graphql_client.execute(self.QUERY)
        return res['data']['norentSendLetter']

    def test_it_requires_login(self):
        self.graphql_client.request.user = AnonymousUser()
        assert self.execute()['errors'] == one_field_err(
            'You do not have permission to use this form!')

    def test_it_raises_err_when_no_rent_periods_are_defined(self):
        assert self.execute()['errors'] == one_field_err(
            'No rent periods are defined!')

    def test_it_raises_err_when_letter_already_sent(self):
        LetterFactory(user=self.user)
        assert self.execute()['errors'] == one_field_err(
            'You have already sent a letter for this rent period!')

    def test_it_raises_err_when_no_onboarding_info_exists(self):
        RentPeriodFactory()
        assert self.execute()['errors'] == one_field_err(
            'You have not onboarded!')

    def test_it_raises_err_when_no_landlord_details_exist(self):
        RentPeriodFactory()
        OnboardingInfoFactory(user=self.user)
        assert self.execute()['errors'] == one_field_err(
            'You haven\'t provided any landlord details yet!')

    def test_it_raises_err_when_used_on_wrong_site(self):
        RentPeriodFactory()
        self.create_landlord_details()
        OnboardingInfoFactory(user=self.user)
        assert self.execute()['errors'] == one_field_err(
            'This form can only be used from the NoRent site.')

    def test_it_works(self, allow_lambda_http, use_norent_site, requests_mock):
        requests_mock.post(
            test_lob_api.LOB_VERIFICATIONS_URL,
            json=test_lob_api.get_sample_verification()
        )
        sample_letter = test_lob_api.get_sample_letter()
        requests_mock.post(
            test_lob_api.LOB_LETTERS_URL,
            json=sample_letter
        )
        RentPeriodFactory()
        self.create_landlord_details()
        OnboardingInfoFactory(user=self.user)
        assert self.execute()['errors'] == []
        letter = Letter.objects.get(user=self.graphql_client.request.user)
        assert str(letter.rent_period.payment_date) == '2020-05-01'
        assert "unable to pay rent" in letter.html_content
        assert "Boop Jones" in letter.html_content
        assert letter.tracking_number == sample_letter['tracking_number']
