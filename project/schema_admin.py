from typing import List, Optional
import logging
from functools import wraps
from graphql import ResolveInfo
from graphene_django.types import DjangoObjectType
import graphene

from project import schema_registry
from users.models import VIEW_USER_PERMISSION, JustfixUser
from twofactor.util import is_request_user_verified
from rapidpro.models import get_group_names_for_user


logger = logging.getLogger(__name__)


class JustfixUserType(DjangoObjectType):
    class Meta:
        model = JustfixUser
        only_fields = (
            "id",
            "username",
            "phone_number",
            "first_name",
            "last_name",
            "email",
            "onboarding_info",
            "letter_request",
        )

    admin_url = graphene.String(required=True)

    rapidpro_groups = graphene.Field(
        graphene.NonNull(graphene.List(graphene.NonNull(graphene.String))),
        description=(
            "The RapidPro groups the user is associated with. Note that this "
            "may be out-of-sync with the RapidPro server."
        ),
    )

    def resolve_admin_url(self, info):
        return self.admin_url

    def resolve_rapidpro_groups(self, info) -> List[str]:
        return get_group_names_for_user(self)


def is_request_verified_staff_user(request) -> bool:
    user = request.user

    if not user.is_authenticated:
        logger.info("User must be authenticated!")
        return False

    if not user.is_staff:
        logger.info("User must be staff!")
        return False

    if not is_request_user_verified(request):
        logger.info("User must be verified via two-factor authentication!")
        return False

    return True


def is_request_verified_user_with_permission(request, permission: str) -> bool:
    user = request.user

    if not is_request_verified_staff_user(request):
        return False

    if not user.has_perm(permission):
        logger.info(f"User does not have {permission} permission!")
        return False

    return True


def ensure_request_has_verified_user_with_permission(permission: str):
    def decorator(fn):
        @wraps(fn)
        def wrapper(parent, info: ResolveInfo, *args, **kwargs):
            if not is_request_verified_user_with_permission(info.context, permission):
                return None

            return fn(parent, info, *args, **kwargs)

        return wrapper

    return decorator


def normalize_phone_number(phone_number: str) -> str:
    """
    Given either a 10-digit phone number or a U.S. phone number in E.164 format,
    returns its 10-digit representation.

    >>> normalize_phone_number('5551234567')
    '5551234567'
    >>> normalize_phone_number('+15551234567')
    '5551234567'
    """

    if phone_number.startswith("+1"):
        phone_number = phone_number[2:]
    return phone_number


@ensure_request_has_verified_user_with_permission(VIEW_USER_PERMISSION)
def resolve_user_admin_details(
    parent, info, phone_number: Optional[str] = None, email: Optional[str] = None
) -> Optional[JustfixUser]:
    if phone_number:
        phone_number = normalize_phone_number(phone_number)
        return JustfixUser.objects.filter(phone_number=phone_number).first()
    elif email:
        return JustfixUser.objects.filter(email__iexact=email).first()
    # TODO: Maybe raise some kind of error?
    return None


@ensure_request_has_verified_user_with_permission(VIEW_USER_PERMISSION)
def resolve_user_search(parent, info, query: str) -> List[JustfixUser]:
    from users.admin import JustfixUserAdmin
    from project.admin import JustfixAdminSite

    MAX_USER_SEARCH_RESULTS = 10

    if not query:
        return []

    users, has_duplicates = JustfixUserAdmin(JustfixUser, JustfixAdminSite()).get_search_results(
        info.context, JustfixUser.objects.all(), query
    )
    return list(users[:MAX_USER_SEARCH_RESULTS])


@schema_registry.register_queries
class AdminQueries:
    user_details = graphene.Field(
        JustfixUserType,
        phone_number=graphene.String(),
        email=graphene.String(),
        resolver=resolve_user_admin_details,
    )

    user_search = graphene.Field(
        graphene.List(graphene.NonNull(JustfixUserType)),
        query=graphene.String(required=True),
        resolver=resolve_user_search,
    )

    is_verified_staff_user = graphene.Boolean(
        description="Whether the user is a staff user who has been verified via 2FA."
    )

    def resolve_is_verified_staff_user(parent, info):
        if is_request_verified_staff_user(info.context):
            return True

        # Really this should be False, but for historical reasons this returns
        # None instead, and we don't want to break any existing code that
        # relies on that right now.
        return None
