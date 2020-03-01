from typing import List, Optional, Dict, Any
from functools import wraps
from pathlib import Path
from django.db import connection
from graphql import GraphQLError, ResolveInfo
import graphene
from graphene import Mutation
from graphene_django.types import DjangoObjectType

from project import schema_registry
from users.models import VIEW_TEXT_MESSAGE_PERMISSION, JustfixUser
from twofactor.util import is_request_user_verified
from project.util.phone_number import ALL_DIGITS_RE
from project.util.streaming_json import generate_json_rows
from .management.commands.update_texting_history import update_texting_history
from .models import Message

MY_DIR = Path(__file__).parent.resolve()

CONVERSATIONS_SQL_FILE = MY_DIR / 'conversations.sql'

DEFAULT_PAGE_SIZE = 50


class TextMessage(graphene.ObjectType):
    sid = graphene.String(required=True)

    date_sent = graphene.DateTime(required=True)

    ordering = graphene.Float(required=True)

    is_from_us = graphene.Boolean(required=True)

    body = graphene.String(required=True)

    error_message = graphene.String()


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


@ensure_request_has_verified_user_with_permission
def resolve_conversation(
    parent,
    info,
    phone_number: str,
    first: int,
    after_or_at: float,
) -> List[Message]:
    kwargs: Dict[str, Any] = {'user_phone_number': phone_number}
    if after_or_at:
        kwargs['ordering__lte'] = after_or_at
    return Message.objects.filter(**kwargs).order_by('-ordering')[:first]


@ensure_request_has_verified_user_with_permission
def resolve_conversations(
    parent,
    info,
    query: str,
    first: int,
    after_or_at: float,
) -> List[LatestTextMessage]:
    where_clauses: List[str] = []

    if after_or_at:
        where_clauses.append("(ordering <= %(after_or_at)s)")
    if ALL_DIGITS_RE.fullmatch(query):
        where_clauses.append("(user_phone_number LIKE '+1' || %(query)s || '%%')")
    elif query:
        where_clauses.append(
            "((usr.first_name || ' ' || usr.last_name) ILIKE '%%' || %(query)s || '%%')"
        )

    where_clause = ('WHERE ' + ' AND '.join(where_clauses)) if where_clauses else ''

    with connection.cursor() as cursor:
        sql = '\n'.join([
            CONVERSATIONS_SQL_FILE.read_text(),
            where_clause,
            "ORDER BY ordering DESC",
            f"LIMIT %(first)s",
        ])
        cursor.execute(sql, {
            'first': first,
            'after_or_at': after_or_at,
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
        query=graphene.String(default_value=""),
        first=graphene.Int(default_value=DEFAULT_PAGE_SIZE),
        after_or_at=graphene.Float(default_value=0),
        resolver=resolve_conversations,
    )

    conversation = graphene.List(
        graphene.NonNull(TextMessage),
        phone_number=graphene.String(),
        first=graphene.Int(default_value=DEFAULT_PAGE_SIZE),
        after_or_at=graphene.Float(default_value=0),
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
