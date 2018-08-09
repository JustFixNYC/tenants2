import graphene


class Query(graphene.ObjectType):
    hello = graphene.String()

    def resolve_hello(self, info) -> str:
        return 'World'


schema = graphene.Schema(query=Query)
