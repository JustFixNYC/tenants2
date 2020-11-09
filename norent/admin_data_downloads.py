from django.db.models import F, Count

from project.admin_download_data import DataDownload, exec_queryset_on_cursor
from users.models import JustfixUser
from .models import Letter, RentPeriod
from .la_zipcodes import LOS_ANGELES_ZIP_CODES


def execute_saje_users_query(cursor, user):
    queryset = JustfixUser.objects.values(
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
        landlord_address=F("landlord_details__address"),
        landlord_email=F("landlord_details__email"),
        landlord_phone_number=F("landlord_details__phone_number"),
        norent_letters_sent=Count("norent_letters"),
    ).filter(
        onboarding_info__zipcode__in=LOS_ANGELES_ZIP_CODES,
    )
    return exec_queryset_on_cursor(queryset, cursor)


def execute_saje_norent_letters_query(cursor, user):
    queryset = Letter.objects.values(
        'user_id',
        'locale',
        'tracking_number',
        'letter_sent_at',
        'letter_emailed_at',
    ).filter(
        user__onboarding_info__zipcode__in=LOS_ANGELES_ZIP_CODES,
    )
    return exec_queryset_on_cursor(queryset, cursor)


DATA_DOWNLOADS = [
    DataDownload(
        name="SAJE-affiliated users",
        slug="saje-users",
        html_desc="Details about users in the LA County area. Contains PII.",
        perms=['norent.view_saje_users'],
        execute_query=execute_saje_users_query,
    ),
    DataDownload(
        name="SAJE-affiliated NoRent letters",
        slug="saje-norent-letters",
        html_desc="Details about NoRent letters sent in the LA County area.",
        perms=['norent.view_saje_users'],
        execute_query=execute_saje_norent_letters_query,
    ),
]
