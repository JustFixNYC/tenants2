import pytest
from django.contrib.auth.models import AnonymousUser

from project.util.testing_util import one_field_err
from users.models import JustfixUser
from users.tests.factories import SecondUserFactory, UserFactory
from project.schema_base import (
    get_last_queried_phone_number,
    update_last_queried_phone_number,
    PhoneNumberAccountStatus
)
import project.locales
from project.tests.test_mapbox import mock_brl_results, mock_no_results
from project.util.testing_util import GraphQLTestingPal
from onboarding.schema import OnboardingStep1Info
from onboarding.tests.test_schema import _exec_onboarding_step_n
from onboarding.tests.factories import OnboardingInfoFactory
from .factories import RentPeriodFactory, LetterFactory
from loc.tests.factories import LandlordDetailsFactory, LandlordDetailsV2Factory
from norent.schema import update_scaffolding, SCAFFOLDING_SESSION_KEY
from norent.models import Letter, UpcomingLetterRentPeriod


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


def test_scaffolding_defaults_work(graphql_client):
    update_scaffolding(graphql_client.request, {'firstName': ''})
    result = graphql_client.execute(
        '''
        query {
          session {
            norentScaffolding {
              firstName,
              canReceiveRttcComms,
            }
          }
        }
        '''
    )['data']['session']['norentScaffolding']
    assert result == {
        'firstName': '',
        'canReceiveRttcComms': None,
    }


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


@pytest.mark.parametrize('zip_code,expected', [
    ('', None),
    ('90210', True),
    ('11201', False),
])
def test_is_in_los_angeles_works(graphql_client, zip_code, expected):
    update_scaffolding(graphql_client.request, {
        'zip_code': zip_code,
    })

    actual = graphql_client.execute(
        '''
        query { session { norentScaffolding { isInLosAngeles } } }
        '''
    )['data']['session']['norentScaffolding']['isInLosAngeles']

    assert actual is expected


def test_email_mutation_updates_session_if_not_logged_in(db, graphql_client):
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


def test_email_mutation_updates_user_email_if_logged_in(db, graphql_client):
    user = UserFactory(is_email_verified=True, email='burp@burp.com')
    graphql_client.request.user = user
    output = graphql_client.execute(
        '''
        mutation {
          output: norentEmail(input: {
            email: "blarf@blarg.com",
        }) {
            errors { field, messages }
            session {
              email,
              isEmailVerified,
              norentScaffolding { email }
            }
          }
        }
        '''
    )['data']['output']
    assert output['errors'] == []
    assert output['session'] == {
        'email': 'blarf@blarg.com',
        'isEmailVerified': False,
        'norentScaffolding': None,
    }


class TestNationalAddressMutation(GraphQLTestingPal):
    QUERY = '''
    mutation NorentNationalAddressMutation($input: NorentNationalAddressInput!) {
        output: norentNationalAddress(input: $input) {
            errors { field, messages }
            isValid
            session {
                norentScaffolding { street, zipCode, aptNumber }
            }
        }
    }
    '''

    DEFAULT_INPUT = {
        'street': '150 court st',
        'zipCode': '12345',
        'aptNumber': '2',
        'noAptNumber': False,
    }

    def set_prior_info(self):
        update_scaffolding(self.request, {
            'city': 'Brooklyn',
            'state': 'NY'
        })

    def test_it_raises_err_without_prior_info(self):
        self.assert_one_field_err("You haven't provided your city and state yet!")

    def test_it_updates_session(self):
        self.set_prior_info()
        output = self.execute()
        assert output['errors'] == []
        assert output['isValid'] is None
        assert output['session']['norentScaffolding'] == {
            'street': '150 court st',
            'zipCode': '12345',
            'aptNumber': '2',
        }

    def test_it_validates_addresses(self, settings, requests_mock):
        settings.MAPBOX_ACCESS_TOKEN = 'blah'
        self.set_prior_info()
        mock_brl_results('150 court st, Brooklyn, NY 12345', requests_mock)
        output = self.execute()
        assert output['errors'] == []
        assert output['isValid'] is True
        assert output['session']['norentScaffolding'] == {
            'street': '150 Court Street',
            'zipCode': '11201',
            'aptNumber': '2',
        }

    def test_it_reports_invaild_addresses_as_invalid(self, settings, requests_mock):
        settings.MAPBOX_ACCESS_TOKEN = 'blah'
        self.set_prior_info()
        mock_no_results('zzz, Brooklyn, NY 12345', requests_mock)
        output = self.execute(input={'street': 'zzz'})
        assert output['errors'] == []
        assert output['isValid'] is False
        assert output['session']['norentScaffolding'] == {
            'street': 'zzz',
            'zipCode': '12345',
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
        'can_receive_rttc_comms': True,
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
        'can_receive_rttc_comms': False,
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
        scaff = {**self.NATIONAL_SCAFFOLDING, 'street': ''}  # type: ignore
        update_scaffolding(self.graphql_client.request, scaff)
        assert self.execute()['errors'] == self.INCOMPLETE_ERR

    def test_it_returns_error_when_national_addr_but_no_phone_number(self):
        update_scaffolding(self.graphql_client.request, self.NATIONAL_SCAFFOLDING)
        assert self.execute()['errors'] == self.INCOMPLETE_ERR

    def test_it_works_for_national_users(self):
        request = self.graphql_client.request
        self.populate_phone_number()
        update_scaffolding(request, self.NATIONAL_SCAFFOLDING)
        assert SCAFFOLDING_SESSION_KEY in request.session
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
        assert oi.agreed_to_norent_terms is True
        assert oi.agreed_to_justfix_terms is False
        assert oi.can_receive_rttc_comms is False

        assert get_last_queried_phone_number(request) is None
        assert SCAFFOLDING_SESSION_KEY not in request.session

    def test_it_works_for_nyc_users(self, smsoutbox, mailoutbox):
        request = self.graphql_client.request
        self.populate_phone_number()
        res = _exec_onboarding_step_n(1, self.graphql_client)
        assert OnboardingStep1Info.get_dict_from_request(request) is not None
        assert res['errors'] == []
        update_scaffolding(request, self.NYC_SCAFFOLDING)
        assert SCAFFOLDING_SESSION_KEY in request.session
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
        assert oi.agreed_to_norent_terms is True
        assert oi.agreed_to_justfix_terms is False
        assert oi.can_receive_rttc_comms is True

        # This will only get filled out if geocoding is enabled, which it's not.
        assert oi.zipcode == ''

        assert len(smsoutbox) == 1
        assert smsoutbox[0].body.startswith("Welcome to NoRent")
        assert len(mailoutbox) == 0

        assert get_last_queried_phone_number(request) is None
        assert OnboardingStep1Info.get_dict_from_request(request) is None
        assert SCAFFOLDING_SESSION_KEY not in request.session


class TestNorentLettersSent:
    QUERY = 'query { session { norentLettersSent } }'

    def execute(self, graphql_client):
        return graphql_client.execute(self.QUERY)['data']['session']['norentLettersSent']

    def test_it_works_when_zero(self, db, graphql_client):
        assert self.execute(graphql_client) == 0

    def test_it_works_when_nonzero(self, db, graphql_client):
        LetterFactory()
        assert self.execute(graphql_client) == 1


class TestNorentLandlordNameAndContactTypes:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, db, graphql_client):
        self.user = UserFactory()
        graphql_client.request.user = self.user
        self.graphql_client = graphql_client

    def execute(self, input):
        input = {
            'name': "Bleh",
            'hasEmailAddress': False,
            'hasMailingAddress': False,
            **input,
        }
        return self.graphql_client.execute(
            '''
            mutation Mutation($input: NorentLandlordNameAndContactTypesInput!) {
                output: norentLandlordNameAndContactTypes(input: $input) {
                    errors { field, messages }
                    session {
                        landlordDetails { name, email, primaryLine }
                        norentScaffolding {
                            hasLandlordEmailAddress,
                            hasLandlordMailingAddress
                        }
                    }
                }
            }
            ''',
            variables={'input': input}
        )['data']['output']

    def test_it_requires_at_least_one_checkbox(self):
        res = self.execute({})
        assert res['errors'] == one_field_err('Please choose at least one option.')

    def test_it_creates_new_landlord_details(self):
        res = self.execute({'hasEmailAddress': True})
        assert res['errors'] == []
        assert res['session'] == {
           'landlordDetails': {'name': 'Bleh', 'email': '', 'primaryLine': ''},
           'norentScaffolding': {'hasLandlordEmailAddress': True,
                                 'hasLandlordMailingAddress': False}
        }

    def test_it_clears_mailing_address_if_needed_but_keeps_email(self):
        LandlordDetailsV2Factory(user=self.user, email='a@b.com')
        res = self.execute({'hasEmailAddress': True})
        assert res['errors'] == []
        assert res['session'] == {
           'landlordDetails': {'name': 'Bleh', 'email': 'a@b.com', 'primaryLine': ''},
           'norentScaffolding': {'hasLandlordEmailAddress': True,
                                 'hasLandlordMailingAddress': False}
        }

    def test_it_clears_email_if_needed_but_keeps_mailing_address(self):
        LandlordDetailsV2Factory(user=self.user, email='a@b.com')
        res = self.execute({'hasMailingAddress': True})
        assert res['errors'] == []
        assert res['session'] == {
           'landlordDetails': {'name': 'Bleh', 'email': '', 'primaryLine': '123 Cloud City Drive'},
           'norentScaffolding': {'hasLandlordEmailAddress': False,
                                 'hasLandlordMailingAddress': True}
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


class TestNorentAvailableRentPeriods:
    def test_it_works(self, db, graphql_client):
        RentPeriodFactory.from_iso("2020-05-01")
        res = graphql_client.execute(
            'query { session { norentAvailableRentPeriods { paymentDate } } }')
        assert res['data']['session']['norentAvailableRentPeriods'] == [
            {'paymentDate': '2020-05-01'}
        ]


class TestNorentUpcomingLetterRentPeriods:
    def execute(self, graphql_client):
        res = graphql_client.execute(
            'query { session { norentUpcomingLetterRentPeriods } }'
        )['data']['session']['norentUpcomingLetterRentPeriods']
        return res

    def test_it_works_with_logged_out_users(self, graphql_client, db):
        assert self.execute(graphql_client) == []

    def test_it_works_with_logged_in_users(self, graphql_client, db):
        user = UserFactory()
        RentPeriodFactory.from_iso("2020-05-01")
        UpcomingLetterRentPeriod.objects.set_for_user(user, ["2020-05-01"])
        graphql_client.request.user = user
        assert self.execute(graphql_client) == ['2020-05-01']


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
        self.user = UserFactory(email="boop@jones.net")
        graphql_client.request.user = self.user
        self.graphql_client = graphql_client

    def create_landlord_details(self):
        LandlordDetailsFactory(user=self.user, email="landlordo@calrissian.net")

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

    def test_it_works(self, allow_lambda_http, use_norent_site,
                      requests_mock, mailoutbox, settings, mocklob):
        settings.IS_DEMO_DEPLOYMENT = False
        settings.LANGUAGES = project.locales.ALL.choices
        RentPeriodFactory()
        self.user.locale = 'es'
        self.user.save()
        self.create_landlord_details()
        OnboardingInfoFactory(user=self.user)
        assert self.execute()['errors'] == []

        letter = Letter.objects.get(user=self.graphql_client.request.user)
        assert str(letter.latest_rent_period.payment_date) == '2020-05-01'
        assert letter.locale == "es"
        assert "unable to pay rent" in letter.html_content
        assert "Boop Jones" in letter.html_content
        assert 'lang="en"' in letter.html_content
        assert 'lang="es"' in letter.localized_html_content
        assert letter.letter_sent_at is not None
        assert letter.tracking_number == mocklob.sample_letter['tracking_number']

        assert len(mailoutbox) == 2
        ll_mail = mailoutbox[0]
        assert ll_mail.to == ['landlordo@calrissian.net']
        assert 'letter attached' in ll_mail.body
        assert "Boop Jones" in ll_mail.body
        assert 'sent on behalf' in ll_mail.subject
        assert len(ll_mail.attachments) == 1
        assert letter.letter_emailed_at is not None

        user_mail = mailoutbox[1]
        assert user_mail.to == ['boop@jones.net']
        assert "https://example.com/es/faqs" in user_mail.body
        assert "Hola Boop" in user_mail.body
        assert "Aquí tienes una copia" in user_mail.subject

        assert len(user_mail.attachments) == 1


class TestOptInToRttcComms(GraphQLTestingPal):
    QUERY = '''
    mutation NorentOptInToRttcCommsMutation($input: NorentOptInToRttcCommsInput!) {
        output: norentOptInToRttcComms(input: $input) {
            errors { field, messages },
            session {
                onboardingInfo { canReceiveRttcComms },
                norentScaffolding { canReceiveRttcComms }
            },
        }
    }
    '''

    DEFAULT_INPUT = {
        'optIn': False,
    }

    @pytest.fixture
    def logged_in(self):
        self.oi = OnboardingInfoFactory()
        self.request.user = self.oi.user

    def test_it_works_when_logged_out(self):
        res = self.execute()
        assert res['errors'] == []
        assert res['session'] == {
            'onboardingInfo': None,
            'norentScaffolding': {'canReceiveRttcComms': False},
        }

        res = self.execute(input={'optIn': True})
        assert res['errors'] == []
        assert res['session'] == {
            'onboardingInfo': None,
            'norentScaffolding': {'canReceiveRttcComms': True},
        }

    def test_it_works_when_logged_in(self, logged_in):
        res = self.execute()
        assert res['errors'] == []
        assert res['session'] == {
            'onboardingInfo': {'canReceiveRttcComms': False},
            'norentScaffolding': None,
        }

        res = self.execute(input={'optIn': True})
        assert res['errors'] == []
        assert res['session'] == {
            'onboardingInfo': {'canReceiveRttcComms': True},
            'norentScaffolding': None,
        }

        self.oi.refresh_from_db()
        assert self.oi.can_receive_rttc_comms is True


class TestSetUpcomingRentPeriods(GraphQLTestingPal):
    QUERY = '''
    mutation NorentSetUpcomingRentPeriodsMutation($input: NorentSetUpcomingRentPeriodsInput!) {
        output: norentSetUpcomingRentPeriods(input: $input) {
            errors { field, messages },
            session {
                norentUpcomingLetterRentPeriods
            },
        }
    }
    '''

    DEFAULT_INPUT = {
        'rentPeriods': ['2020-05-01'],
    }

    @pytest.fixture
    def logged_in(self):
        self.rp = RentPeriodFactory.from_iso("2020-05-01")
        self.user = UserFactory()
        self.request.user = self.user

    def test_it_errors_when_logged_out(self):
        self.assert_one_field_err("You do not have permission to use this form!")

    def test_it_works_when_logged_in(self, logged_in):
        res = self.execute()
        assert res['errors'] == []
        assert res['session'] == {
            'norentUpcomingLetterRentPeriods': ['2020-05-01'],
        }
