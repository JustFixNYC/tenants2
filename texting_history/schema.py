from typing import List
from functools import wraps
from pathlib import Path
from django.db import connection
from django.conf import settings
from graphql import GraphQLError, ResolveInfo
import graphene

from project import schema_registry
from users.models import VIEW_TEXT_MESSAGE_PERMISSION
from twofactor.util import is_request_user_verified
from project.util.phone_number import ALL_DIGITS_RE
from project.util.streaming_json import generate_json_rows
from texting.twilio import tendigit_to_e164

MY_DIR = Path(__file__).parent.resolve()

CONVERSATIONS_SQL_FILE = MY_DIR / 'conversations.sql'

PAGE_SIZE = 50


class TextMessage(graphene.ObjectType):
    date_sent = graphene.DateTime(required=True)

    is_from_us = graphene.Boolean(required=True)

    body = graphene.String(required=True)

    user_phone_number = graphene.String(required=True)

    user_full_name = graphene.String()

    user_id = graphene.Int()


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
def resolve_conversations(parent, info, query: str, page: int) -> List[TextMessage]:
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
            "ORDER BY date_sent DESC",
            "LIMIT %(page_size)s OFFSET %(offset)s"
        ])
        cursor.execute(sql, {
            'our_number': tendigit_to_e164(settings.TWILIO_PHONE_NUMBER),
            'offset': (page - 1) * PAGE_SIZE,
            'page_size': PAGE_SIZE,
            'query': query,
        })
        return [TextMessage(**row) for row in generate_json_rows(cursor)]


@schema_registry.register_queries
class TextingHistory:
    conversations = graphene.List(
        graphene.NonNull(TextMessage),
        query=graphene.String(),
        page=graphene.Int(),
        resolver=resolve_conversations,
    )
