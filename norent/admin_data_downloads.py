from django.db.models import F, Count

from project.admin_download_data import DataDownload, queryset_data_download
from users.models import JustfixUser
from .models import Letter, RentPeriod
from .la_zipcodes import LOS_ANGELES_ZIP_CODES


@queryset_data_download
def execute_saje_users_query(user):
    return (
        JustfixUser.objects.values(
            "id",
            "date_joined",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "locale",
            "onboarding_info__address",
            "onboarding_info__state",
            "onboarding_info__zipcode",
            "onboarding_info__apt_number",
            "onboarding_info__can_receive_saje_comms",
            landlord_name=F("landlord_details__name"),
            landlord_street_adress=F("landlord_details__primary_line"),
            landlord_city=F("landlord_details__city"),
            landlord_state=F("landlord_details__state"),
            landlord_zip_code=F("landlord_details__zip_code"),
            landlord_email=F("landlord_details__email"),
            landlord_phone_number=F("landlord_details__phone_number"),
            norent_letters_sent=Count("norent_letters"),
            city=F("onboarding_info__non_nyc_city"),
        )
        .filter(
            onboarding_info__zipcode__in=LOS_ANGELES_ZIP_CODES,
        )
        .order_by("id")
    )


@queryset_data_download
def execute_saje_norent_letters_query(user):
    from django.db.models import Count, Q

    rent_periods = RentPeriod.objects.all().order_by("payment_date")
    rent_periods_kwargs = {
        f"rent_period_{rp.payment_date}": Count("rent_periods", filter=Q(rent_periods__id=rp.id))
        for rp in rent_periods
    }
    return (
        Letter.objects.values(
            "user_id",
            "locale",
            "tracking_number",
            "letter_sent_at",
            "letter_emailed_at",
            **rent_periods_kwargs,
        )
        .filter(
            user__onboarding_info__zipcode__in=LOS_ANGELES_ZIP_CODES,
        )
        .order_by("id")
    )


@queryset_data_download
def execute_rttc_users_query(user):
    return (
        JustfixUser.objects.values(
            "id",
            "date_joined",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "locale",
            "onboarding_info__address",
            "onboarding_info__state",
            "onboarding_info__zipcode",
            "onboarding_info__apt_number",
            city=F("onboarding_info__non_nyc_city"),
        )
        .filter(
            onboarding_info__can_receive_rttc_comms=True,
        )
        .order_by("id")
    )


DATA_DOWNLOADS = [
    DataDownload(
        name="SAJE-affiliated users",
        slug="saje-users",
        html_desc="Details about users in the LA County area. Contains PII.",
        perms=["norent.view_saje_users"],
        execute_query=execute_saje_users_query,
    ),
    DataDownload(
        name="SAJE-affiliated NoRent letters",
        slug="saje-norent-letters",
        html_desc="Details about NoRent letters sent in the LA County area.",
        perms=["norent.view_saje_users"],
        execute_query=execute_saje_norent_letters_query,
    ),
    DataDownload(
        name="RTTC-affiliated users",
        slug="rttc-users",
        html_desc="Details about users who opted-in to RTTC comms. Contains PII.",
        perms=["norent.view_rttc_users"],
        execute_query=execute_rttc_users_query,
    ),
]
