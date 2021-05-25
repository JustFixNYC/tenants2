from typing import Optional
from django.contrib import admin
from django.urls import reverse

from .admin_user_tabs import UserWithTabsMixin
from project.util.admin_util import admin_field, make_button_link
from users.action_progress import ProgressAnnotation, IN_PROGRESS, COMPLETE
import airtable.sync


@admin_field(
    short_description="SMS conversations",
)
def sms_conversations_field(self, obj):
    return make_button_link(
        f"/admin/conversations/?phone=%2B1{obj.phone_number}", "View SMS conversations"
    )


@admin_field(short_description="Impersonation", allow_tags=True)
def impersonate_field(self, obj):
    if obj.pk:
        return make_button_link(
            reverse("admin:impersonate-user", kwargs={"user_id": obj.pk}),
            f"Impersonate {obj.full_legal_name}\u2026",
        )
    return ""


@admin_field(admin_order_field="onboarding_info__signup_intent")
def user_signup_intent(self, obj):
    if hasattr(obj, "onboarding_info"):
        return obj.onboarding_info.signup_intent


class UserProxyAdmin(airtable.sync.SyncUserOnSaveMixin, UserWithTabsMixin, admin.ModelAdmin):
    """
    This class can be used to build specialized proxy views of the User model
    for different kinds of products (e.g. Letter of Complaint, HP Action, etc).
    This allows the basic user data to be viewed (with a link to view more on
    the primary user change page) with all the relevant data for the product
    as inline admin views.

    The list view can also be optimized to display only users that have used
    (or signaled intent to use) a particular product.
    """

    list_display = ["phone_number", "first_name", "last_name", "last_login", "signup_intent"]

    fields = [
        "first_name",
        "last_name",
        "phone_number",
        "email",
        "signup_intent",
        "address",
        "sms_conversations",
        "locale",
        "impersonate",
    ]

    readonly_fields = fields

    ordering = ("-last_login",)

    search_fields = ["phone_number", "username", "first_name", "last_name", "email"]

    signup_intent = user_signup_intent

    sms_conversations = sms_conversations_field

    impersonate = impersonate_field

    # If provided, this will ensure that the user changelist view will exclude
    # users who have not started the relevant action.
    progress_annotation: Optional[ProgressAnnotation] = None

    def address(self, obj):
        if hasattr(obj, "onboarding_info"):
            return ", ".join(obj.onboarding_info.address_lines_for_mailing)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.prefetch_related("onboarding_info")
        pa = self.progress_annotation
        if request.resolver_match.func.__name__ == "changelist_view" and pa:
            # We only want to constrain the queryset if we're on the
            # list view: we don't want to do it universally because then
            # links from e.g. the regular User admin view wouldn't be able to
            # access our proxy model's detail view.
            queryset = queryset.annotate(**{pa.name: pa.expression}).filter(
                **{f"{pa.name}__in": [IN_PROGRESS, COMPLETE]}
            )
        return queryset
