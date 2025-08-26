from project.admin_download_data import DataDownload, queryset_data_download
from .models import LetterSenderLetter
from norent.la_zipcodes import LOS_ANGELES_ZIP_CODES


@queryset_data_download
def execute_saje_lettersender_letters_query(user):
    return (
        LetterSenderLetter.objects.values(
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
        name="SAJE-affiliated Letter Sender letters",
        slug="saje-lettersender-letters",
        html_desc="Details about Letter Sender letters sent in the LA County area.",
        perms=["lettersender.view_saje_users"],
        execute_query=execute_saje_lettersender_letters_query,
    ),
]
