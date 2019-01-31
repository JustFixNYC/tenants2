import graphene
from graphql import ResolveInfo
from graphene_django.types import DjangoObjectType

from .models import TenantResource


class TenantResourceType(DjangoObjectType):
    class Meta:
        model = TenantResource
        only_fields = ('name', 'address', 'website')


class FindhelpInfo:
    tenant_resources = graphene.List(graphene.NonNull(TenantResourceType), required=True)

    def resolve_tenant_resources(self, info: ResolveInfo):
        from project.settings import env

        if not env.ENABLE_FINDHELP:
            return []

        return TenantResource.objects.all()[:10]
