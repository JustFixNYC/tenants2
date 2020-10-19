import graphene


class GraphQLMailingAddress(graphene.ObjectType):
    name = graphene.String(
        required=True,
        description="The name of the receipient at the address."
    )
    primary_line = graphene.String(
        required=True,
        description='Usually the first line of the address, e.g. "150 Court Street"'
    )
    city = graphene.String(
        required=True,
        description='The city of the address, e.g. "Brooklyn".'
    )
    state = graphene.String(
        required=True,
        description='The two-letter state or territory for the address, e.g. "NY".'
    )
    zip_code = graphene.String(
        required=True,
        description='The zip code of the address, e.g. "11201" or "94107-2282".'
    )
