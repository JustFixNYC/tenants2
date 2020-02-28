from typing import List, Optional
from functools import wraps
from pathlib import Path
from django.db import connection
from django.conf import settings
from graphql import GraphQLError, ResolveInfo
import graphene
from graphene import Mutation
from graphene_django.types import DjangoObjectType

from project import schema_registry
from users.models import VIEW_TEXT_MESSAGE_PERMISSION, JustfixUser
from twofactor.util import is_request_user_verified
from project.util.phone_number import ALL_DIGITS_RE
from project.util.streaming_json import generate_json_rows
from texting.twilio import tendigit_to_e164
from .management.commands.update_texting_history import update_texting_history

MY_DIR = Path(__file__).parent.resolve()

CONVERSATIONS_SQL_FILE = MY_DIR / 'conversations.sql'

CONVERSATION_SQL_FILE = MY_DIR / 'conversation.sql'

PAGE_SIZE = 50


class TextMessage(graphene.ObjectType):
    sid = graphene.String(required=True)

    date_sent = graphene.DateTime(required=True)

    is_from_us = graphene.Boolean(required=True)

    body = graphene.String(required=True)


class LatestTextMessage(TextMessage):
    user_phone_number = graphene.String(required=True)

    user_full_name = graphene.String()

    user_id = graphene.Int()


class JustfixUserType(DjangoObjectType):
    class Meta:
        model = JustfixUser
        only_fields = (
            'id',
            'username',
            'phone_number',
            'first_name',
            'last_name',
            'onboarding_info',
            'letter_request',
        )

    admin_url = graphene.String(required=True)

    def resolve_admin_url(self, info):
        return self.admin_url


def ensure_request_has_verified_user_with_permission(fn):
    @wraps(fn)
    def wrapper(parent, info: ResolveInfo, *args, **kwargs):
        request = info.context
        user = request.user

        if not user.is_authenticated:
            raise GraphQLError("User must be authenticated!")

        if not is_request_user_verified(request):
            raise GraphQLError("User must be verified via two-factor authentication!")

        if not user.has_perm(VIEW_TEXT_MESSAGE_PERMISSION):
            raise GraphQLError("User does not have permission to view text messages!")

        return fn(parent, info, *args, **kwargs)

    return wrapper


def get_sql_limit_clause_for_page(page: int, page_size: int = PAGE_SIZE) -> str:
    assert isinstance(page, int)
    offset = (page - 1) * page_size
    return f"LIMIT {page_size} OFFSET {offset}"


@ensure_request_has_verified_user_with_permission
def resolve_conversation(parent, info, phone_number: str, page: int) -> List[TextMessage]:
    with connection.cursor() as cursor:
        sql = '\n'.join([
            CONVERSATION_SQL_FILE.read_text(),
            get_sql_limit_clause_for_page(page)
        ])
        cursor.execute(sql, {
            'our_number': tendigit_to_e164(settings.TWILIO_PHONE_NUMBER),
            'their_number': phone_number,
        })
        return [TextMessage(**row) for row in generate_json_rows(cursor)]


@ensure_request_has_verified_user_with_permission
def resolve_conversations(parent, info, query: str, page: int) -> List[LatestTextMessage]:
    where_clause = ''
    if ALL_DIGITS_RE.fullmatch(query):
        where_clause = "WHERE user_phone_number LIKE '+1' || %(query)s || '%%'"
    elif query:
        where_clause = (
            "WHERE (usr.first_name || ' ' || usr.last_name) "
            "ILIKE '%%' || %(query)s || '%%'"
        )

    with connection.cursor() as cursor:
        sql = '\n'.join([
            CONVERSATIONS_SQL_FILE.read_text(),
            where_clause,
            "ORDER BY date_sent DESC, is_from_us DESC",
            get_sql_limit_clause_for_page(page),
        ])
        cursor.execute(sql, {
            'our_number': tendigit_to_e164(settings.TWILIO_PHONE_NUMBER),
            'query': query,
        })
        return [LatestTextMessage(**row) for row in generate_json_rows(cursor)]


@ensure_request_has_verified_user_with_permission
def resolve_user_admin_details(parent, info, phone_number: str) -> Optional[JustfixUser]:
    phone_number = normalize_phone_number(phone_number)
    return JustfixUser.objects.filter(phone_number=phone_number).first()


def normalize_phone_number(phone_number: str) -> str:
    '''
    Given either a 10-digit phone number or a U.S. phone number in E.164 format,
    returns its 10-digit representation.

    >>> normalize_phone_number('5551234567')
    '5551234567'
    >>> normalize_phone_number('+15551234567')
    '5551234567'
    '''

    if phone_number.startswith('+1'):
        phone_number = phone_number[2:]
    return phone_number


@schema_registry.register_queries
class TextingHistory:
    conversations = graphene.List(
        graphene.NonNull(LatestTextMessage),
        query=graphene.String(),
        page=graphene.Int(),
        resolver=resolve_conversations,
    )

    conversation = graphene.List(
        graphene.NonNull(TextMessage),
        phone_number=graphene.String(),
        page=graphene.Int(),
        resolver=resolve_conversation,
    )

    user_details = graphene.Field(
        JustfixUserType,
        phone_number=graphene.String(),
        resolver=resolve_user_admin_details,
    )


@schema_registry.register_mutation
class UpdateTextingHistory(Mutation):
    latest_message = graphene.DateTime()

    @ensure_request_has_verified_user_with_permission
    def mutate(root, info):
        latest_message = update_texting_history(silent=True)
        return UpdateTextingHistory(latest_message=latest_message)
