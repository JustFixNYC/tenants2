from typing import List, Dict, Any, Union
from pathlib import Path
from django.db import connection
import graphene
from graphene import Mutation

from project import schema_registry
from project.schema_admin import (
    ensure_request_has_verified_user_with_permission,
    is_request_verified_user_with_permission,
)
from users.models import VIEW_TEXT_MESSAGE_PERMISSION
from project.util.streaming_json import generate_json_rows
from .management.commands.update_texting_history import update_texting_history
from .models import Message
from .query_parser import Query

MY_DIR = Path(__file__).parent.resolve()

CONVERSATIONS_SQL_FILE = MY_DIR / "conversations.sql"

DEFAULT_PAGE_SIZE = 50


class TextMessage(graphene.ObjectType):
    # Note that by 'sid' we just mean a generic 'string identifier', not
    # necessarily the Twilio sid of the message.  It is guaranteed to be
    # unique within the context of the dataset it's associated with.
    sid = graphene.String(required=True)

    date_sent = graphene.DateTime(required=True)

    ordering = graphene.Float(required=True)

    is_from_us = graphene.Boolean(required=True)

    body = graphene.String(required=True)

    error_message = graphene.String()


class LatestTextMessage(TextMessage):
    user_phone_number = graphene.String(required=True)

    user_full_name = graphene.String(deprecation_reason="This is now called user_full_legal_name")

    user_full_legal_name = graphene.String()

    user_id = graphene.Int()


class TextMessagesResult(graphene.ObjectType):
    messages = graphene.List(graphene.NonNull(TextMessage), required=True)
    has_next_page = graphene.Boolean(required=True)


class LatestTextMessagesResult(graphene.ObjectType):
    messages = graphene.List(graphene.NonNull(LatestTextMessage), required=True)
    has_next_page = graphene.Boolean(required=True)


@ensure_request_has_verified_user_with_permission(VIEW_TEXT_MESSAGE_PERMISSION)
def resolve_conversation(
    parent,
    info,
    phone_number: str,
    first: int,
    after_or_at: float,
) -> TextMessagesResult:
    kwargs: Dict[str, Any] = {"user_phone_number": phone_number}
    if after_or_at:
        kwargs["ordering__lte"] = after_or_at
    qs = Message.objects.filter(**kwargs).order_by("-ordering")
    messages = list(qs[:first])
    return TextMessagesResult(messages=messages, has_next_page=qs.count() > len(messages))


def insert_before(source: str, find: str, insert: str):
    """
    >>> insert_before('bloop troop', 'troop', 'hello ')
    'bloop hello troop'
    """

    assert find in source
    return source.replace(find, f"{insert}{find}")


@ensure_request_has_verified_user_with_permission(VIEW_TEXT_MESSAGE_PERMISSION)
def resolve_conversations(
    parent,
    info,
    query: str,
    first: int,
    after_or_at: float,
) -> LatestTextMessagesResult:
    where_clauses: List[str] = []
    extra_joins: List[str] = []
    sql_args: Dict[str, Union[int, str, float]] = {}

    parsed = Query.parse(query)

    latest_conversation_sql = CONVERSATIONS_SQL_FILE.read_text()

    if parsed.message_body:
        latest_conversation_sql = insert_before(
            source=latest_conversation_sql,
            find="WINDOW",
            insert="WHERE BODY ILIKE '%%' || %(message_body)s || '%%'\n",
        )
        sql_args["message_body"] = parsed.message_body

    with_clause = f"WITH latest_conversation_msg AS ({latest_conversation_sql})"

    select_with_user_info_statement = """
    SELECT
        msg.*,
        usr.id as user_id,
        usr.first_name || ' ' || usr.last_name as user_full_legal_name
    FROM
        latest_conversation_msg AS msg
    LEFT JOIN
        users_justfixuser AS usr ON '+1' || usr.phone_number = msg.user_phone_number
    """

    if after_or_at:
        where_clauses.append("(ordering <= %(after_or_at)s)")
        sql_args["after_or_at"] = after_or_at
    if parsed.phone_number:
        where_clauses.append("(user_phone_number LIKE '+1' || %(phone_number)s || '%%')")
        sql_args["phone_number"] = parsed.phone_number
    if parsed.full_legal_name:
        where_clauses.append(
            "((usr.first_name || ' ' || usr.last_name) ILIKE '%%' || %(full_legal_name)s || '%%')"
        )
        sql_args["full_legal_name"] = parsed.full_legal_name
    if parsed.has_hpa_packet:
        extra_joins.append(
            "INNER JOIN hpaction_hpactiondocuments AS hpadocs ON usr.id = hpadocs.user_id"
        )

    where_clause = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
    order_clause = "ORDER BY ordering DESC"
    limit_clause = f"LIMIT %(first)s"
    sql_args["first"] = first

    with connection.cursor() as cursor:
        base_select = "\n".join(
            [
                select_with_user_info_statement,
                where_clause,
                *extra_joins,
            ]
        )
        cursor.execute(
            "\n".join(
                [
                    with_clause,
                    base_select,
                    order_clause,
                    limit_clause,
                ]
            ),
            sql_args,
        )
        messages = [LatestTextMessage(**row) for row in generate_json_rows(cursor)]
        cursor.execute(
            "\n".join(
                [
                    f"{with_clause}, filtered_messages AS ({base_select})",
                    "SELECT COUNT(*) FROM filtered_messages",
                ]
            ),
            sql_args,
        )
        count = cursor.fetchone()[0]
        return LatestTextMessagesResult(messages=messages, has_next_page=count > len(messages))


@schema_registry.register_queries
class TextingHistory:
    conversations = graphene.Field(
        LatestTextMessagesResult,
        query=graphene.String(default_value=""),
        first=graphene.Int(default_value=DEFAULT_PAGE_SIZE),
        after_or_at=graphene.Float(default_value=0),
        resolver=resolve_conversations,
    )

    conversation = graphene.Field(
        TextMessagesResult,
        phone_number=graphene.String(),
        first=graphene.Int(default_value=DEFAULT_PAGE_SIZE),
        after_or_at=graphene.Float(default_value=0),
        resolver=resolve_conversation,
    )


@schema_registry.register_mutation
class UpdateTextingHistory(Mutation):
    auth_error = graphene.Boolean(default_value=False)

    latest_message = graphene.DateTime()

    def mutate(root, info):
        if not is_request_verified_user_with_permission(info.context, VIEW_TEXT_MESSAGE_PERMISSION):
            return UpdateTextingHistory(auth_error=True)
        latest_message = update_texting_history(silent=True)
        return UpdateTextingHistory(latest_message=latest_message)
