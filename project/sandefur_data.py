from django.db.models import F, Subquery, OuterRef, Count, Q

from .admin_download_data import DataDownload, queryset_data_download
from users.models import CHANGE_USER_PERMISSION, JustfixUser
from rh.models import RentalHistoryRequest
from hpaction.models import HP_ACTION_CHOICES


@queryset_data_download
def execute_users_query(user):
    rh_requests = RentalHistoryRequest.objects.filter(
        user=OuterRef("pk"),
    )
    return JustfixUser.objects.values(
        "id",
        "date_joined",
        "onboarding_info__signup_intent",
        "onboarding_info__pad_bbl",
        "onboarding_info__address",
        "onboarding_info__borough",
        "onboarding_info__state",
        "onboarding_info__zipcode",
        loc_submitted_at=F("letter_request__created_at"),
        loc_mail_choice=F("letter_request__mail_choice"),
        loc_mailed_at=F("letter_request__letter_sent_at"),
        rh_last_requested_at=Subquery(rh_requests.order_by("-created_at").values("created_at")[:1]),
        rh_count=Count("rentalhistoryrequest"),
        hpa_documents_generated=Count(
            "hpactiondocuments", filter=Q(hpactiondocuments__kind=HP_ACTION_CHOICES.NORMAL)
        ),
    ).exclude(onboarding_info__borough__exact="")


DATA_DOWNLOADS = [
    DataDownload(
        name="Sandefur user data",
        slug="sandefur-user-data",
        html_desc="Details about NYC users for Rebecca Sandefur. Contains PII.",
        perms=[CHANGE_USER_PERMISSION],
        execute_query=execute_users_query,
    ),
]
