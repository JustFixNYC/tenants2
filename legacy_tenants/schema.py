from typing import Optional
import graphene
from graphql import ResolveInfo
from django.conf import settings

from .models import LegacyUserInfo


class LegacyUserSessionInfo(object):
    '''
    A mixin class defining all legacy tenants app-related queries.
    '''

    prefers_legacy_app = graphene.Boolean(
        description=(
            "Whether we should redirect this user to the legacy "
            "tenant app after they log in. If null, the user is either not "
            "a legacy user, or legacy app integration is disabled."
        )
    )

    def resolve_prefers_legacy_app(self, info: ResolveInfo) -> Optional[bool]:
        if not settings.LEGACY_MONGODB_URL:
            return None
        user = info.context.user
        if not user.is_authenticated:
            return None
        if not LegacyUserInfo.is_legacy_user(user):
            return None
        return user.legacy_info.prefers_legacy_app
