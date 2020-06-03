from frontend.tests.util import get_frontend_query
from rh.tests.factories import RentalHistoryRequestFactory
from rh.schema import get_slack_notify_text
from rh.models import RentalHistoryRequest


VALID_RH_DATA = {
    "firstName": "Boop",
    "lastName": "Jones",
    "address": "123 Boop Way",
    "borough": "STATEN_ISLAND",
    "apartmentNumber": "36C",
    "phoneNumber": "2120000000"
}

RH_DATA_QUERY = '''
query {
    session {
        rentalHistoryInfo {
            firstName
            lastName
            address
            borough
            apartmentNumber
            phoneNumber
        }
    }
}
'''

RH_EMAIL_MUTATION = """
mutation {
    rhSendEmail(input: {}) {
        errors { field, messages }
        session {
            rentalHistoryInfo {
                firstName
            }
        }
    }
}
"""


def _get_rh_info(graphql_client):
    return graphql_client.execute(RH_DATA_QUERY)['data']['session']['rentalHistoryInfo']


def _exec_rh_form(graphql_client, **input_kwargs):
    return graphql_client.execute(
        get_frontend_query(f'RhFormMutation.graphql'),
        variables={'input': {
            **VALID_RH_DATA,
            **input_kwargs
        }}
    )['data'][f'output']


def test_rh_form_validates_data(db, graphql_client):
    ob = _exec_rh_form(graphql_client, firstName='')
    assert len(ob['errors']) > 0
    assert _get_rh_info(graphql_client) is None


def test_rh_form_saves_data_to_session(db, graphql_client):
    ob = _exec_rh_form(graphql_client)
    assert ob['errors'] == []
    assert ob['session']['rentalHistoryInfo'] == {
        **VALID_RH_DATA,
        'zipcode': '',
        "addressVerified": False}


def test_rh_form_saves_info_to_db(db, graphql_client):
    _exec_rh_form(graphql_client)
    graphql_client.execute(RH_EMAIL_MUTATION)
    rhrs = list(RentalHistoryRequest.objects.all())
    assert len(rhrs) == 1
    rhr = rhrs[0]
    assert rhr.first_name == 'Boop'
    assert rhr.last_name == 'Jones'
    assert rhr.phone_number == '2120000000'
    assert rhr.address == '123 Boop Way'


def test_rh_form_sends_email_and_clears_session(db, graphql_client, mailoutbox):
    ob = _exec_rh_form(graphql_client)
    assert ob['errors'] == []
    result = graphql_client.execute(
        RH_EMAIL_MUTATION)['data']['rhSendEmail']
    assert result == {'errors': [], 'session': {'rentalHistoryInfo': None}}
    assert len(mailoutbox) == 1


def test_email_fails_with_no_form_data(db, graphql_client, mailoutbox):
    result = graphql_client.execute(
        RH_EMAIL_MUTATION)['data']['rhSendEmail']
    assert result == {'errors': [
        {
          "field": "__all__",
          "messages": [
            "You haven't completed all the previous steps yet."
          ]
        }
      ], 'session': None}
    assert len(mailoutbox) == 0


class TestGetSlackNotifyText:
    def test_it_works_for_logged_in_users(self, db):
        rhr = RentalHistoryRequestFactory(user__first_name='Blarf', first_name='Glorp')
        assert get_slack_notify_text(rhr) == (
            f"<https://example.com/admin/users/justfixuser/{rhr.user.pk}/change/|Blarf> has "
            f"requested "
            f"<https://example.com/admin/rh/rentalhistoryrequest/{rhr.pk}/change/|rent history>!"
        )

    def test_it_works_for_anonymous_users(self, db):
        rhr = RentalHistoryRequestFactory(user=None, first_name='Glorp & Blorp')
        assert get_slack_notify_text(rhr) == (
            f"Glorp &amp; Blorp has requested "
            f"<https://example.com/admin/rh/rentalhistoryrequest/{rhr.pk}/change/|rent history>!"
        )
