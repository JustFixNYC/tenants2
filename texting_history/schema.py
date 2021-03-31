from typing import List, Optional, Dict, Any, Union
import logging
from functools import wraps
from pathlib import Path
from django.db import connection
from graphql import ResolveInfo
import graphene
from graphene import Mutation
from graphene_django.types import DjangoObjectType

from project import schema_registry
from users.models import VIEW_TEXT_MESSAGE_PERMISSION, JustfixUser
from twofactor.util import is_request_user_verified
from project.util.streaming_json import generate_json_rows
from rapidpro.models import get_group_names_for_user
from .management.commands.update_texting_history import update_texting_history
from .models import Message
from .query_parser import Query

MY_DIR = Path(__file__).parent.resolve()

CONVERSATIONS_SQL_FILE = MY_DIR / "conversations.sql"

DEFAULT_PAGE_SIZE = 50

logger = logging.getLogger(__name__)


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

    user_full_name = graphene.String()

    user_id = graphene.Int()


class TextMessagesResult(graphene.ObjectType):
    messages = graphene.List(graphene.NonNull(TextMessage), required=True)
    has_next_page = graphene.Boolean(required=True)


class LatestTextMessagesResult(graphene.ObjectType):
    messages = graphene.List(graphene.NonNull(LatestTextMessage), required=True)
    has_next_page = graphene.Boolean(required=True)


class JustfixUserType(DjangoObjectType):
    class Meta:
        model = JustfixUser
        only_fields = (
            "id",
            "username",
            "phone_number",
            "first_name",
            "last_name",
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


def is_request_verified_user_with_permission(request):
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

    if not user.has_perm(VIEW_TEXT_MESSAGE_PERMISSION):
        logger.info("User does not have permission to view text messages!")
        return False

    return True


def ensure_request_has_verified_user_with_permission(fn):
    @wraps(fn)
    def wrapper(parent, info: ResolveInfo, *args, **kwargs):
        if not is_request_verified_user_with_permission(info.context):
            return None

        return fn(parent, info, *args, **kwargs)

    return wrapper


@ensure_request_has_verified_user_with_permission
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


@ensure_request_has_verified_user_with_permission
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
        usr.first_name || ' ' || usr.last_name as user_full_name
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
    if parsed.full_name:
        where_clauses.append(
            "((usr.first_name || ' ' || usr.last_name) ILIKE '%%' || %(full_name)s || '%%')"
        )
        sql_args["full_name"] = parsed.full_name
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


@ensure_request_has_verified_user_with_permission
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


@ensure_request_has_verified_user_with_permission
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

    user_details = graphene.Field(
        JustfixUserType,
        phone_number=graphene.String(),
        email=graphene.String(),
        resolver=resolve_user_admin_details,
    )

    user_search = graphene.Field(
        graphene.NonNull(graphene.List(graphene.NonNull(JustfixUserType))),
        query=graphene.String(required=True),
        resolver=resolve_user_search,
    )

    is_verified_staff_user = graphene.Boolean(
        resolver=ensure_request_has_verified_user_with_permission(lambda parent, info: True),
    )


@schema_registry.register_mutation
class UpdateTextingHistory(Mutation):
    auth_error = graphene.Boolean(default_value=False)

    latest_message = graphene.DateTime()

    def mutate(root, info):
        if not is_request_verified_user_with_permission(info.context):
            return UpdateTextingHistory(auth_error=True)
        latest_message = update_texting_history(silent=True)
        return UpdateTextingHistory(latest_message=latest_message)
