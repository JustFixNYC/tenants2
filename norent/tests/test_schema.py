import pytest

from norent.schema import update_scaffolding


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
