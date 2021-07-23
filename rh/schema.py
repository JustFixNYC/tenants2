from project.util.rename_dict_keys import with_keys_renamed
from onboarding.scaffolding import (
    OnboardingScaffolding,
    OnboardingScaffoldingMutation,
    get_scaffolding,
    purge_scaffolding,
)
from . import models, forms, email_dhcr
from typing import Dict, Any, Optional
from django.utils import translation
from django.db import connections
from django.conf import settings

import graphene
from graphql import ResolveInfo
from project import slack
from project.util.django_graphql_session_forms import DjangoSessionFormObjectType
from project.util.session_mutation import SessionFormMutation
from project.util.streaming_json import generate_json_rows
from project.util.site_util import absolute_reverse, SITE_CHOICES
from project import schema_registry
import project.locales
from frontend.static_content import react_render_email
from rapidpro.followup_campaigns import trigger_followup_campaign_async
from loc.landlord_lookup import lookup_bbl_and_bin_and_full_address

RENT_STAB_INFO_SESSION_KEY = "rh_rent_stab_v1"

BLANK_RENT_STAB_INFO = {"latest_year": None, "latest_unit_count": None}


def get_slack_notify_text(rhr: models.RentalHistoryRequest) -> str:
    rh_link = slack.hyperlink(
        text="rent history",
        href=absolute_reverse("admin:rh_rentalhistoryrequest_change", args=[rhr.pk]),
    )
    if rhr.user:
        user_text = slack.hyperlink(text=rhr.user.best_first_name, href=rhr.user.admin_url)
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

    with connections[settings.NYCDB_DATABASE].cursor() as cursor:
        cursor.execute(sql_query, {"bbl": bbl})
        json_result = list(generate_json_rows(cursor))
        if not json_result:
            return None
        return json_result[0]


def process_rent_stab_data(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    for item in sorted(raw_data.items(), reverse=True):
        if item[1] and item[1] > 0:
            year = item[0].replace("uc", "")
            assert year
            return {"latest_year": year, "latest_unit_count": item[1]}
    return BLANK_RENT_STAB_INFO


def get_rent_stab_info_for_bbl(bbl: str) -> Optional[Dict[str, Any]]:
    # Case 1: No connection to GeoSearch or the nycdb database
    if not (bbl and settings.NYCDB_DATABASE):
        return None

    raw_data = run_rent_stab_sql_query(bbl)

    # Case 2: We connected to the database, but no RS data was found
    if not raw_data:
        return BLANK_RENT_STAB_INFO

    # Case 3: We connected to the database, and RS data was found
    else:
        return process_rent_stab_data(raw_data)


class RhFormInfo(DjangoSessionFormObjectType):
    class Meta:
        form_class = forms.RhForm
        session_key = f"rh_v{forms.FIELD_SCHEMA_VERSION}"


@schema_registry.register_mutation
class RhForm(OnboardingScaffoldingMutation):
    class Meta:
        form_class = forms.RhForm

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        result = super().perform_mutate(form, info)
        scf = get_scaffolding(request)
        assert scf.street and scf.borough

        full_address = scf.street + ", " + scf.borough
        bbl, _, _ = lookup_bbl_and_bin_and_full_address(full_address)
        request.session[RENT_STAB_INFO_SESSION_KEY] = get_rent_stab_info_for_bbl(bbl)
        return result


def scaffolding_has_rental_history_request_info(scf: OnboardingScaffolding) -> bool:
    return bool(
        scf.first_name
        and scf.last_name
        and scf.street
        and scf.borough
        and scf.phone_number
        and scf.apt_number
    )


@schema_registry.register_mutation
class RhSendEmail(SessionFormMutation):
    class Meta:
        form_class = forms.RhSendEmail

    @classmethod
    def perform_mutate(cls, form, info):
        request = info.context
        scf = get_scaffolding(request)
        if not scaffolding_has_rental_history_request_info(scf):
            cls.log(info, "User has not completed the rental history form, aborting mutation.")
            return cls.make_error("You haven't completed all the previous steps yet.")

        rhr = models.RentalHistoryRequest(
            first_name=scf.first_name,
            last_name=scf.last_name,
            apartment_number=scf.apt_number,
            phone_number=scf.phone_number,
            address=scf.street,
            address_verified=scf.address_verified,
            borough=scf.borough,
            zipcode=scf.zip_code,
        )
        rhr.set_user(request.user)
        rhr.full_clean()
        rhr.save()
        slack.sendmsg_async(get_slack_notify_text(rhr), is_safe=True)

        email = react_render_email(
            SITE_CHOICES.JUSTFIX,
            project.locales.DEFAULT,
            "rh/email-to-dhcr.txt",
            session=request.session,
        )
        email_dhcr.send_email_to_dhcr(email.subject, email.body)
        trigger_followup_campaign_async(
            f"{scf.first_name} {scf.last_name}",
            scf.phone_number,
            "RH",
            locale=translation.get_language_from_request(request, check_path=True),
        )
        purge_scaffolding(request)
        return cls.mutation_success()


class RhRentStabData(graphene.ObjectType):
    latest_year = graphene.String(
        description=(
            "The last year that the user's building had rent stabilized units. "
            "If null, no units were found since 2007. "
            "Note: this will never be the empty string. "
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
    rental_history_info = graphene.Field(
        RhFormInfo, deprecation_reason="Use session.onboardingScaffolding instead."
    )

    rent_stab_info = graphene.Field(RhRentStabData)

    def resolve_rent_stab_info(self, info: ResolveInfo):
        request = info.context
        kwargs = request.session.get(RENT_STAB_INFO_SESSION_KEY, {})
        if kwargs:
            return RhRentStabData(**kwargs)
        return None

    def resolve_rental_history_info(self, info: ResolveInfo):
        scf = get_scaffolding(info.context)
        if scaffolding_has_rental_history_request_info(scf):
            d = with_keys_renamed(scf.dict(), RhFormInfo._meta.form_class.from_scaffolding_keys)
            return d
        return None
