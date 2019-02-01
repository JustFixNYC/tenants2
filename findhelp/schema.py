import graphene
from graphql import ResolveInfo
from graphene import ObjectType
from graphene_django.types import DjangoObjectType

from .models import TenantResource


class TenantResourceType(DjangoObjectType):
    class Meta:
        model = TenantResource
        only_fields = ('name', 'address', 'website')


class TenantResourceWithDistance(ObjectType):
    resource = graphene.Field(TenantResourceType, required=True)
    distance = graphene.Float(required=True)


class FindhelpInfo:
    tenant_resources = graphene.List(
        graphene.NonNull(TenantResourceWithDistance),
        latitude=graphene.Float(required=True),
        longitude=graphene.Float(required=True),
    )

    def resolve_tenant_resources(self, info: ResolveInfo, latitude: float, longitude: float):
        from project.settings import env

        if not env.ENABLE_FINDHELP:
            return None

        queryset = TenantResource.objects.find_best_for(
            latitude=latitude,
            longitude=longitude,
        )

        return (TenantResourceWithDistance(
            resource=tr,
            distance=tr.distance.mi
        ) for tr in queryset)
