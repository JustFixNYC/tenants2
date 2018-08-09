from django.contrib.auth.models import User


def test_hello_works_when_logged_out(graphql_client):
    result = graphql_client.execute('query { hello(thing: "BLARG") }')
    assert result['data']['hello'] == \
        'Hello from GraphQL! You passed in "BLARG" and are not logged in'


def test_hello_works_when_logged_in(graphql_client):
    graphql_client.request.user = User()
    result = graphql_client.execute('query { hello(thing: "U") }')
    assert result['data']['hello'] == 'Hello from GraphQL! You passed in "U" and are logged in'


def test_there_works(graphql_client):
    result = graphql_client.execute('query { there }')
    assert result['data']['there'] == 123
