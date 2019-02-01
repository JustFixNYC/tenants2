import graphene
from graphql import ResolveInfo
from graphene_django.types import DjangoObjectType

from .models import TenantResource


class TenantResourceType(DjangoObjectType):
    class Meta:
        model = TenantResource
        only_fields = ('name', 'address', 'website', 'phone_number')

    latitude = graphene.Float()
    longitude = graphene.Float()
    miles_away = graphene.Float()

    def resolve_latitude(self, info: ResolveInfo):
        if self.geocoded_point is None:
            return None
        return self.geocoded_point[1]

    def resolve_longitude(self, info: ResolveInfo):
        if self.geocoded_point is None:
            return None
        return self.geocoded_point[0]

    def resolve_miles_away(self, info: ResolveInfo):
        if not hasattr(self, 'distance'):
            return None
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
        )[:10]
