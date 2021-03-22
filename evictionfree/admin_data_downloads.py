from django.db.models import F, OuterRef, Exists

from users.models import JustfixUser
from project.admin_download_data import DataDownload, queryset_data_download
from nycha.models import NychaProperty


@queryset_data_download
def execute_evictionfree_users_query(user):
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
            "onboarding_info__can_rtc_sms",
            "onboarding_info__can_hj4a_sms",
            "hardship_declaration_details__index_number",
            "hardship_declaration_details__has_financial_hardship",
            "hardship_declaration_details__has_health_risk",
            borough_if_inside_nyc=F("onboarding_info__borough"),
            city_if_outside_nyc=F("onboarding_info__non_nyc_city"),
            hardship_declaration_mailed_at=F("submitted_hardship_declaration__mailed_at"),
            hardship_declaration_emailed_at=F("submitted_hardship_declaration__emailed_at"),
            bbl=F("onboarding_info__pad_bbl"),
            is_nycha_bbl=Exists(
                NychaProperty.objects.filter(pad_bbl=OuterRef("onboarding_info__pad_bbl"))
            ),
        )
        .filter(
            onboarding_info__agreed_to_evictionfree_terms=True,
        )
        .order_by("id")
    )


DATA_DOWNLOADS = [
    # Currently these data downloads are identical, but because we anticipate that some
    # functionality/data on the site might eventually be only the purview of only RTC
    # or only HJ4A, we're keeping them separate now.
    DataDownload(
        name="EvictionFreeNY.org users (RTC)",
        slug="evictionfree-rtc-users",
        html_desc="Details about users who use EvictionFreeNY.org, for RTC. Contains PII.",
        perms=["evictionfree.view_evictionfree_rtc_users"],
        execute_query=execute_evictionfree_users_query,
    ),
    DataDownload(
        name="EvictionFreeNY.org users (HJ4A)",
        slug="evictionfree-hj4a-users",
        html_desc="Details about users who use EvictionFreeNY.org, for HJ4A. Contains PII.",
        perms=["evictionfree.view_evictionfree_hj4a_users"],
        execute_query=execute_evictionfree_users_query,
    ),
]
