import graphene
from graphql import ResolveInfo


class Query(graphene.ObjectType):
    '''
    Here is some help text that gets passed back to
    GraphQL clients as part of our schema.
    '''

    hello = graphene.String(thing=graphene.String())
    there = graphene.Int()

    def resolve_hello(self, info: ResolveInfo, thing: str) -> str:
        return f'Hello from GraphQL! You passed in "{thing}"'

    def resolve_there(self, info) -> int:
        return 123


schema = graphene.Schema(query=Query)
