from django.db.models import F, Subquery, OuterRef, Count, Q

from .admin_download_data import DataDownload, queryset_data_download
from users.models import CHANGE_USER_PERMISSION, JustfixUser
from rh.models import RentalHistoryRequest
from issues.models import Issue, CustomIssue
from rapidpro.models import UserContactGroup
from hpaction.models import (
    HP_ACTION_CHOICES,
    HPActionDocuments,
    HP_DOCUSIGN_STATUS_CHOICES,
    DocusignEnvelope,
)


@queryset_data_download
def execute_users_query(user):
    rh_requests = RentalHistoryRequest.objects.filter(
        user=OuterRef("pk"),
    )
    hpa_documents = HPActionDocuments.objects.filter(
        user=OuterRef("pk"), kind=HP_ACTION_CHOICES.NORMAL
    )
    ehpas = DocusignEnvelope.objects.filter(
        docs__user=OuterRef("pk"), status=HP_DOCUSIGN_STATUS_CHOICES.SIGNED
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
        hpa_documents_last_generated_at=Subquery(
            hpa_documents.order_by("-created_at").values("created_at")[:1]
        ),
        hpa_documents_count=Count(
            "hpactiondocuments", filter=Q(hpactiondocuments__kind=HP_ACTION_CHOICES.NORMAL)
        ),
        ehpa_last_signed_at=Subquery(ehpas.order_by("-created_at").values("created_at")[:1]),
        ehpa_count=Count(
            "hpactiondocuments__docusignenvelope",
            filter=Q(hpactiondocuments__docusignenvelope__status=HP_DOCUSIGN_STATUS_CHOICES.SIGNED),
        ),
    ).exclude(onboarding_info__borough__exact="")


execute_users_query.extra_docs = {
    "rh_last_requested_at": (
        "When the user last requested rent history. Note that the actual address they requested "
        "rent history for may not have been their own."
    ),
    "rh_count": "How many times the user requested rent history (regardless of the address).",
    "hpa_documents_last_generated_at": (
        "When the user last generated a regular (non-emergency) HP Action packet. Note that "
        "the regular HP Action product was superseded by the Emergency HP Action packet "
        "in spring 2020."
    ),
    "hpa_documents_count": "How many regular HP Action packets the user generated.",
    "loc_submitted_at": (
        "When the user submitted their letter of compaint, i.e. requested that we "
        "mail their letter for them or opted to mail it themselves."
    ),
    "ehpa_last_signed_at": (
        "When the user last e-signed an Emergency HP Action. Note that "
        "this product was not live until spring 2020."
    ),
    "ehpa_count": "How many Emergency HP Actions the user has e-signed.",
}


@queryset_data_download
def execute_issues_query(user):
    return Issue.objects.values(
        "user_id",
        "created_at",
        "area",
        "value",
    )


@queryset_data_download
def execute_custom_issues_query(user):
    return CustomIssue.objects.values(
        "user_id",
        "created_at",
        "updated_at",
        "area",
        "description",
    )


@queryset_data_download
def execute_rapidpro_groups_query(user):
    return UserContactGroup.objects.values(
        "user_id",
        "earliest_known_date",
        "group__name",
    )


execute_rapidpro_groups_query.extra_docs = {
    "name": "The name of the RapidPro contact group to which the user belongs",
    "earliest_known_date": "The earliest date the user was observed to be in this contact group.",
    "user": "The ID of a user. Can be joined with other datasets.",
}

DATA_DOWNLOADS = [
    DataDownload(
        name="Sandefur user data",
        slug="sandefur-user-data",
        html_desc="Details about NYC users for Rebecca Sandefur. Contains PII.",
        perms=[CHANGE_USER_PERMISSION],
        execute_query=execute_users_query,
    ),
    DataDownload(
        name="Sandefur issue data",
        slug="sandefur-issue-data",
        html_desc="Details about non-custom issue data for Rebecca Sandefur.",
        perms=[CHANGE_USER_PERMISSION],
        execute_query=execute_issues_query,
    ),
    DataDownload(
        name="Sandefur custom issue data",
        slug="sandefur-custom-issue-data",
        html_desc="Details about custom issue data for Rebecca Sandefur. Contains PII.",
        perms=[CHANGE_USER_PERMISSION],
        execute_query=execute_custom_issues_query,
    ),
    DataDownload(
        name="Sandefur rapidpro contact group data",
        slug="sandefur-rapidpro-contact-group-data",
        html_desc="Details about RapidPro (TextIt) contact groups for Rebecca Sandefur.",
        perms=[CHANGE_USER_PERMISSION],
        execute_query=execute_rapidpro_groups_query,
    ),
]
