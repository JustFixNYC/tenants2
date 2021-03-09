import graphene
from graphql import ResolveInfo
from graphene_django.types import DjangoObjectType

from .models import TenantResource
from project import schema_registry


MAX_RESULTS = 10


class TenantResourceType(DjangoObjectType):
    class Meta:
        model = TenantResource
        only_fields = ("name", "address", "website", "phone_number", "description")

    latitude = graphene.Float(
        required=True, description="The latitude of the tenant resource's address."
    )
    longitude = graphene.Float(
        required=True, description="The longitude of the tenant resource's address."
    )
    miles_away = graphene.Float(
        required=True,
        description=(
            "The distance, in miles, that the resource's address is located "
            "from the location provided in the query. The distance represents "
            "the 'straight line' distance and does not take into account roads "
            "or other geographic features."
        ),
    )

    def resolve_latitude(self, info: ResolveInfo):
        assert self.geocoded_point is not None
        return self.geocoded_point[1]

    def resolve_longitude(self, info: ResolveInfo):
        assert self.geocoded_point is not None
        return self.geocoded_point[0]

    def resolve_miles_away(self, info: ResolveInfo):
        assert hasattr(self, "distance")
        return self.distance.mi


@schema_registry.register_queries
class FindhelpInfo:
    tenant_resources = graphene.List(
        graphene.NonNull(TenantResourceType),
        latitude=graphene.Float(required=True),
        longitude=graphene.Float(required=True),
        description=(
            "Find tenant resources that service the given location, ordered by their "
            "proximity to the location."
        ),
        required=True,
    )

    def resolve_tenant_resources(self, info: ResolveInfo, latitude: float, longitude: float):
        return TenantResource.objects.find_best_for(
            latitude=latitude,
            longitude=longitude,
        )[:MAX_RESULTS]
