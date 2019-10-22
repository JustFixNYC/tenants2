from project.tests.util import get_frontend_query


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
        **VALID_RH_DATA,  # type:ignore
        "addressVerified": False}


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
