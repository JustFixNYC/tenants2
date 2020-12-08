import graphene
from graphene_django.types import DjangoObjectType
from graphql import ResolveInfo

from . import models, referral
from project import schema_registry


class PartnerOrgType(DjangoObjectType):
    class Meta:
        model = models.PartnerOrg
        only_fields = ('slug', 'name', 'website')


@schema_registry.register_session_info
class PartnershipsSessionInfo:
    active_partner_referral = graphene.Field(PartnerOrgType)

    def resolve_active_partner_referral(self, info: ResolveInfo):
        request = info.context
        return referral.get_partner(request)
