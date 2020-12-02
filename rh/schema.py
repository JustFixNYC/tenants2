from . import models, forms, email_dhcr
from typing import Dict, Any, Optional
from django.utils import translation
from django.db import connections
from django.conf import settings

import graphene
from graphql import ResolveInfo
from project import slack
from project.util.django_graphql_session_forms import (
    DjangoSessionFormObjectType,
    DjangoSessionFormMutation,
)
from project.util.session_mutation import SessionFormMutation
from project.util.streaming_json import generate_json_rows
from project.util.site_util import absolute_reverse, SITE_CHOICES
from project import schema_registry
import project.locales
from frontend.static_content import react_render_email
from rapidpro.followup_campaigns import trigger_followup_campaign_async
from loc.landlord_lookup import lookup_bbl_and_bin_and_full_address

RENT_STAB_INFO_SESSION_KEY = "rh_rent_stab_v1"

BLANK_RENT_STAB_INFO = {
    "latest_year": None,
    "latest_unit_count": None
}


def get_slack_notify_text(rhr: models.RentalHistoryRequest) -> str:
    rh_link = slack.hyperlink(
        text="rent history",
        href=absolute_reverse("admin:rh_rentalhistoryrequest_change", args=[rhr.pk]),
    )
    if rhr.user:
        user_text = slack.hyperlink(text=rhr.user.first_name, href=rhr.user.admin_url)
    else:
        user_text = slack.escape(rhr.first_name)
    return f"{user_text} has requested {rh_link}!"


def run_rent_stab_sql_query(bbl: str) -> Optional[Dict[str, Any]]:
    sql_query = """
        select uc2007, uc2008, uc2009, uc2010, uc2011, uc2012, uc2013,
             uc2014, uc2015, uc2016, uc2017, uc2018, uc2019
        from rentstab
        full join rentstab_v2 using(ucbbl)
        where ucbbl = %(bbl)s
    """
    if not settings.NYCDB_DATABASE:
        return None

    with connections[settings.NYCDB_DATABASE].cursor() as cursor:
        cursor.execute(sql_query, {"bbl": bbl})
        json_result = list(generate_json_rows(cursor))
        if not json_result:
            return BLANK_RENT_STAB_INFO
        return json_result[0]


def process_rent_stab_data(raw_data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not raw_data:
        return BLANK_RENT_STAB_INFO
    for item in sorted(raw_data.items(), reverse=True):
        if item[1] and item[1] > 0:
<<<<<<< Updated upstream
            return {"latest_year": item[0].replace("uc", ""), "latest_unit_count": item[1]}
    return None
=======
            return {
                "latest_year": item[0].replace("uc", ""),
                "latest_unit_count": item[1]
            }
    return BLANK_RENT_STAB_INFO
>>>>>>> Stashed changes


class RhFormInfo(DjangoSessionFormObjectType):
    class Meta:
        form_class = forms.RhForm
        session_key = f"rh_v{forms.FIELD_SCHEMA_VERSION}"


@schema_registry.register_mutation
class RhForm(DjangoSessionFormMutation):
    class Meta:
        source = RhFormInfo

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        result = super().perform_mutate(form, info)
        form_data = RhFormInfo.get_dict_from_request(request)
        assert form_data is not None

        full_address = form_data["address"] + ", " + form_data["borough"]
        bbl, _, _ = lookup_bbl_and_bin_and_full_address(full_address)
        if bbl:
            rent_stab_info = process_rent_stab_data(run_rent_stab_sql_query(bbl))
            request.session[RENT_STAB_INFO_SESSION_KEY] = rent_stab_info
        return result


@schema_registry.register_mutation
class RhSendEmail(SessionFormMutation):
    class Meta:
        form_class = forms.RhSendEmail

    @classmethod
    def perform_mutate(cls, form, info):
        request = info.context
        form_data = RhFormInfo.get_dict_from_request(request)
        if form_data is None:
            cls.log(info, "User has not completed the rental history form, aborting mutation.")
            return cls.make_error("You haven't completed all the previous steps yet.")

        rhr = models.RentalHistoryRequest(**form_data)
        rhr.set_user(request.user)
        rhr.full_clean()
        rhr.save()
        slack.sendmsg_async(get_slack_notify_text(rhr), is_safe=True)

        first_name: str = form_data["first_name"]
        last_name: str = form_data["last_name"]
        email = react_render_email(
            SITE_CHOICES.JUSTFIX,
            project.locales.DEFAULT,
            "rh/email-to-dhcr.txt",
            session={RhFormInfo._meta.session_key: form_data},
        )
        email_dhcr.send_email_to_dhcr(email.subject, email.body)
        trigger_followup_campaign_async(
            f"{first_name} {last_name}",
            form_data["phone_number"],
            "RH",
            locale=translation.get_language_from_request(request, check_path=True),
        )
        RhFormInfo.clear_from_request(request)
        return cls.mutation_success()


class RhRentStabData(graphene.ObjectType):
    latest_year = graphene.Int(
        description=(
            "The last year that the user's building had rent stabilized units. "
            "If null, no units were found since 2007."
        )
    )
    latest_unit_count = graphene.Int(
        description=(
            "The most recent count of rent stabilized units in user's building. "
            "If null, no units were found since 2007."
        )
    )


@schema_registry.register_session_info
class RhSessionInfo(object):
    rental_history_info = RhFormInfo.field()
    rent_stab_info = graphene.Field(RhRentStabData)

    def resolve_rent_stab_info(self, info: ResolveInfo):
        request = info.context
        kwargs = request.session.get(RENT_STAB_INFO_SESSION_KEY, {})
        if kwargs:
            return RhRentStabData(**kwargs)
        return None
