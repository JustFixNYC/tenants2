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


def test_mutation_updates_session(graphql_client):
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
