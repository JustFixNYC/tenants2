import graphene
from graphql import ResolveInfo
from graphene_django.types import DjangoObjectType

from .models import TenantResource


MAX_RESULTS = 10


class TenantResourceType(DjangoObjectType):
    class Meta:
        model = TenantResource
        only_fields = ('name', 'address', 'website', 'phone_number', 'description')

    latitude = graphene.Float(required=True)
    longitude = graphene.Float(required=True)
    miles_away = graphene.Float(required=True)

    def resolve_latitude(self, info: ResolveInfo):
        assert self.geocoded_point is not None
        return self.geocoded_point[1]

    def resolve_longitude(self, info: ResolveInfo):
        assert self.geocoded_point is not None
        return self.geocoded_point[0]

    def resolve_miles_away(self, info: ResolveInfo):
        assert hasattr(self, 'distance')
        return self.distance.mi


class FindhelpInfo:
    tenant_resources = graphene.List(
        graphene.NonNull(TenantResourceType),
        latitude=graphene.Float(required=True),
        longitude=graphene.Float(required=True),
    )

    def resolve_tenant_resources(self, info: ResolveInfo, latitude: float, longitude: float):
        from project.settings import env

        if not env.ENABLE_FINDHELP:
            return None

        return TenantResource.objects.find_best_for(
            latitude=latitude,
            longitude=longitude,
        )[:MAX_RESULTS]
