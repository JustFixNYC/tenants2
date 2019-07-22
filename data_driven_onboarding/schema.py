import graphene

from project import schema_registry, geocoding
from onboarding.forms import get_geocoding_search_text


class DDOSuggestion(graphene.ObjectType):
    name = graphene.String(required=True)
    url = graphene.String(required=True)


class DDOSuggestionsResult(graphene.ObjectType):
    full_address = graphene.String(required=True)
    suggestions = graphene.NonNull(graphene.List(graphene.NonNull(DDOSuggestion)))


@schema_registry.register_queries
class DDOQuery:
    ddo_suggestions = graphene.Field(
        DDOSuggestionsResult,
        address=graphene.String(),
        borough=graphene.String(),
    )

    def resolve_ddo_suggestions(self, info, address: str, borough: str):
        features = geocoding.search(get_geocoding_search_text(address, borough))
        if not features:
            return None
        props = features[0].properties
        return DDOSuggestionsResult(
            full_address=props.label,
            suggestions=[
                DDOSuggestion(
                    name=f"Who Owns What",
                    url=f"https://whoownswhat.justfix.nyc/bbl/{props.pad_bbl}"
                )
            ]
        )
