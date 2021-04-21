from django.contrib import admin
from django.urls import reverse

from project.util.admin_util import make_edit_link, admin_field, make_button_link
import airtable.sync


@admin_field(
    short_description="SMS conversations",
)
def sms_conversations_field(self, obj):
    return make_button_link(
        f"/admin/conversations?phone=%2B1{obj.phone_number}", "View SMS conversations"
    )


@admin_field(short_description="Impersonation", allow_tags=True)
def impersonate_field(self, obj):
    if obj.pk:
        return make_button_link(
            reverse("admin:impersonate-user", kwargs={"user_id": obj.pk}),
            f"Impersonate {obj.full_name}\u2026",
        )
    return ""


@admin_field(admin_order_field="onboarding_info__signup_intent")
def user_signup_intent(self, obj):
    if hasattr(obj, "onboarding_info"):
        return obj.onboarding_info.signup_intent


class UserProxyAdmin(airtable.sync.SyncUserOnSaveMixin, admin.ModelAdmin):
    """
    This class can be used to build specialized proxy views of the User model
    for different kinds of products (e.g. Letter of Complaint, HP Action, etc).
    This allows the basic user data to be viewed (with a link to view more on
    the primary user change page) with all the relevant data for the product
    as inline admin views.

    The list view can also be optimized to display only users that have used
    (or signaled intent to use) a particular product.
    """

    change_form_template = "users/justfixuser_change_form.html"

    list_display = ["phone_number", "first_name", "last_name", "last_login", "signup_intent"]

    fields = [
        "first_name",
        "last_name",
        "phone_number",
        "email",
        "signup_intent",
        "address",
        "edit_user",
        "sms_conversations",
        "locale",
        "impersonate",
    ]

    readonly_fields = fields

    ordering = ("-last_login",)

    search_fields = ["phone_number", "username", "first_name", "last_name", "email"]

    edit_user = make_edit_link("View/edit user details")

    signup_intent = user_signup_intent

    sms_conversations = sms_conversations_field

    impersonate = impersonate_field

    def render_change_form(self, request, context, *args, **kwargs):
        from .admin_user_tabs import get_user_tab_context_info

        return super().render_change_form(
            request,
            {
                **context,
                **get_user_tab_context_info(kwargs.get("obj")),
            },
            *args,
            **kwargs,
        )

    def address(self, obj):
        if hasattr(obj, "onboarding_info"):
            return ", ".join(obj.onboarding_info.address_lines_for_mailing)

    def filter_queryset_for_changelist_view(self, queryset):
        """
        This method can be used to filter the list of users that are shown
        in the list view, if e.g. one wants to show only users who have
        actually used (or signaled intent to use) a particular product.
        """

        return queryset

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.prefetch_related("onboarding_info")
        if request.resolver_match.func.__name__ == "changelist_view":
            # We only want to constrain the queryset if we're on the
            # list view: we don't want to do it universally because then
            # links from e.g. the regular User admin view wouldn't be able to
            # access our proxy model's detail view.
            queryset = self.filter_queryset_for_changelist_view(queryset)
        return queryset
