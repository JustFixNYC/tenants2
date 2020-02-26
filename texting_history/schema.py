from typing import List
from project import schema_registry
from pathlib import Path
from django.db import connection
from django.conf import settings
import graphene

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


@schema_registry.register_queries
class TextingHistory:
    conversations = graphene.List(
        graphene.NonNull(TextMessage),
        query=graphene.String(),
        page=graphene.Int(),
    )

    def resolve_conversations(self, info, query: str, page: int) -> List[TextMessage]:
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
