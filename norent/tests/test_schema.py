from .factories import NationalOnboardingInfoFactory


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


def test_tenant_info_mutation_updates_session(graphql_client):
    output = graphql_client.execute(
        '''
        mutation {
          output: norentTenantInfo(input: {
            firstName: "boeop",
            lastName: "blap",
            street: "boing",
            city: "oof",
            state: "OH",
            zipCode: "43569",
            aptNumber: "2",
            email: "boop@jones.com",
            phoneNumber: "5551234567"
        }) {
            errors { field, messages }
            session {
              norentScaffolding { firstName }
            }
          }
        }
        '''
    )['data']['output']
    assert output['errors'] == []
    assert output['session']['norentScaffolding'] == {
        'firstName': 'boeop'
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


class TestNationalOnboardingInfo:
    QUERY = '''
    query {
        session {
            nationalOnboardingInfo {
                address, aptNumber, city, state, zipCode
            }
        }
    }
    '''

    def execute(self, graphql_client):
        return graphql_client.execute(self.QUERY)['data']['session']['nationalOnboardingInfo']

    def test_it_returns_none_when_user_is_logged_out(self, graphql_client, db):
        assert self.execute(graphql_client) is None

    def test_it_returns_info_when_user_is_logged_in(self, graphql_client, db):
        onb = NationalOnboardingInfoFactory()
        graphql_client.request.user = onb.user
        assert self.execute(graphql_client) == {
            'address': '620 GUERRERO ST',
            'aptNumber': '8',
            'city': 'SAN FRANCISCO',
            'state': 'CA',
            'zipCode': '94110'
        }
