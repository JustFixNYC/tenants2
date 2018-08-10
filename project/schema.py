import graphene
from graphql import ResolveInfo
from django.contrib.auth import logout


class Logout(graphene.Mutation):
    ok = graphene.Boolean()

    def mutate(self, info: ResolveInfo):
        request = info.context
        if request.user.is_authenticated:
            logout(request)
        return Logout(ok=True)


class Mutations(graphene.ObjectType):
    logout = Logout.Field()


class Query(graphene.ObjectType):
    '''
    Here is some help text that gets passed back to
    GraphQL clients as part of our schema.
    '''

    hello = graphene.String(thing=graphene.String())
    there = graphene.Int()

    def resolve_hello(self, info: ResolveInfo, thing: str) -> str:
        if info.context.user.is_authenticated:
            status = "logged in"
        else:
            status = "not logged in"
        return f'Hello from GraphQL! You passed in "{thing}" and are {status}'

    def resolve_there(self, info) -> int:
        return 123


schema = graphene.Schema(query=Query, mutation=Mutations)
