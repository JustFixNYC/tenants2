from project.tests.util import get_frontend_query


VALID_RH_DATA = {
    "firstName": "Boop",
    "lastName": "Jones",
    "address": "123 Boop Way",
    "borough": "Staten Island",
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


def test_rh_form_validates_data(graphql_client):
    ob = _exec_rh_form(graphql_client, firstName='')
    assert len(ob['errors']) > 0
    assert _get_rh_info is None


def test_rh_form_works(graphql_client):
    ob = _exec_rh_form(graphql_client)
    assert ob['errors'] == []
    assert ob['session']['rentalHistoryInfo'] == VALID_RH_DATA
    assert _get_rh_info(graphql_client)['aptNumber'] == '36C'
    assert _get_rh_info(graphql_client)['addressVerified'] is False


def test_email_letter_works(db, graphql_client, mailoutbox):
    result = graphql_client.execute(
        """
        mutation {
            rhSendEmail(input: {recipients: [{email: "boop@jones.com"}]}) {
                errors { field, messages }
                recipients
            }
        }
        """
    )['data']['emailLetter']
    assert result == {'errors': [], 'recipients': ['boop@jones.com']}
    assert len(mailoutbox) == 1
