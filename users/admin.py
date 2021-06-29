from findhelp.admin_map import MapModelAdmin
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from project.util.admin_util import admin_field
from .forms import JustfixUserCreationForm, JustfixUserChangeForm
from .models import JustfixUser
import rapidpro.models
from onboarding.admin import OnboardingInline
from .admin_user_tabs import UserWithTabsMixin
from .admin_user_proxy import impersonate_field, user_signup_intent, sms_conversations_field
from texting.models import get_lookup_description_for_phone_number
from loc.admin import LandlordDetailsInline
import airtable.sync


PERMISSIONS_LABEL = "Permissions"
NON_SUPERUSER_FIELDSET_LABELS = (PERMISSIONS_LABEL,)


class JustfixUserAdmin(
    airtable.sync.SyncUserOnSaveMixin, UserWithTabsMixin, UserAdmin, MapModelAdmin
):
    add_form = JustfixUserCreationForm
    form = JustfixUserChangeForm
    model = JustfixUser
    ordering = ("-last_login",)
    list_filter = [
        "onboarding_info__signup_intent",
    ] + list(UserAdmin.list_filter)
    list_display = [
        "phone_number",
        "username",
        "first_name",
        "last_name",
        "preferred_first_name",
        "last_login",
        "signup_intent",
    ]
    fieldsets = (
        (
            "Personal info",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "preferred_first_name",
                    "email",
                    "is_email_verified",
                    "phone_number",
                    "phone_number_lookup_details",
                    "sms_conversations",
                    "locale",
                    "impersonate",
                )
            },
        ),
        (
            "Username and password",
            {
                "fields": ("username", "password"),
                "description": (
                    "Note that the username is never visible to users, but it is used to "
                    "identify users in server logs. Therefore, it doesn't need to be "
                    "very human-friendly, and ideally it should be devoid of any "
                    "personally identifiable information such as a user's real name "
                    "or phone number."
                ),
            },
        ),
        (
            "Additional read-only details",
            {
                "fields": ("rapidpro_contact_groups",),
                "description": (
                    "Note that these details may be slightly out-of-date "
                    "due to technical limitations."
                ),
            },
        ),
        (
            PERMISSIONS_LABEL,
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    non_superuser_fieldsets = tuple(
        (label, details)
        for label, details in fieldsets
        if label not in NON_SUPERUSER_FIELDSET_LABELS
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("phone_number", "username", "password1", "password2"),
            },
        ),
    )
    inlines = (
        OnboardingInline,
        # We'll consider this part of the core user info b/c all our
        # flows ask for it, and it can be considered part of the user's
        # "core data".
        LandlordDetailsInline,
    )

    signup_intent = user_signup_intent

    search_fields = ["phone_number", *UserAdmin.search_fields]

    readonly_fields = [
        "phone_number_lookup_details",
        "rapidpro_contact_groups",
        "sms_conversations",
        "impersonate",
        *UserAdmin.readonly_fields,
    ]

    def get_fieldsets(self, request, obj=None):
        if obj is not None and not request.user.is_superuser:
            return self.non_superuser_fieldsets
        return super().get_fieldsets(request, obj)

    @admin_field(
        short_description="Rapidpro contact groups",
    )
    def rapidpro_contact_groups(self, obj):
        if obj is not None:
            groups = rapidpro.models.get_group_names_for_user(obj)
            if groups:
                return ", ".join(groups)

        return "None"

    sms_conversations = sms_conversations_field

    def save_model(self, request, obj: JustfixUser, form, change):
        super().save_model(request, obj, form, change)
        airtable.sync.sync_user(obj)

    def phone_number_lookup_details(self, obj):
        return get_lookup_description_for_phone_number(obj.phone_number)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.prefetch_related("onboarding_info")

    impersonate = impersonate_field


admin.site.register(JustfixUser, JustfixUserAdmin)
