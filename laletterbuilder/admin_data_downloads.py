from project.admin_download_data import DataDownload, queryset_data_download
from .models import HabitabilityLetter
from norent.la_zipcodes import LOS_ANGELES_ZIP_CODES


@queryset_data_download
def execute_saje_laletterbuilder_letters_query(user):
    return (
        HabitabilityLetter.objects.values(
            "user_id",
            "locale",
            "tracking_number",
            "letter_sent_at",
            "letter_emailed_at",
        )
        .filter(
            user__onboarding_info__zipcode__in=LOS_ANGELES_ZIP_CODES,
        )
        .order_by("id")
    )


DATA_DOWNLOADS = [
    DataDownload(
        name="SAJE-affiliated LA TAC letters",
        slug="saje-latac-letters",
        html_desc="Details about LA TAC letters sent in the LA County area.",
        perms=["laletterbuilder.view_saje_users"],
        execute_query=execute_saje_laletterbuilder_letters_query,
    ),
]
