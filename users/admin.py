from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html

from project.util.admin_util import admin_field, get_admin_url_for_class
from .forms import JustfixUserCreationForm, JustfixUserChangeForm
from .models import JustfixUser
import rapidpro.models
from onboarding.admin import OnboardingInline
from legacy_tenants.admin import LegacyUserInline
from legacy_tenants.models import LegacyUserInfo
from .admin_user_proxy import user_signup_intent
from texting.models import get_lookup_description_for_phone_number
from loc.admin import LOCUser, LandlordDetailsInline
from hpaction.admin import HPUser
from norent.admin import NorentUser
import airtable.sync


PERMISSIONS_LABEL = 'Permissions'
NON_SUPERUSER_FIELDSET_LABELS = (PERMISSIONS_LABEL,)


def make_button_link(url: str, short_description: str):
    return format_html(
        '<a class="button" href="{}">{}</a>', url, short_description
    )


def make_link_to_other_user_view(model_class, short_description):
    '''
    We have specialized proxy views of the User model for different kinds
    of products (e.g. Letter of Complaint, HP Action, etc). This generates
    links to them.
    '''

    @admin_field(
        short_description=short_description,
        allow_tags=True
    )
    def link(self, obj):
        url = get_admin_url_for_class(model_class, obj.pk)
        return make_button_link(url, short_description)

    return link


class JustfixUserAdmin(airtable.sync.SyncUserOnSaveMixin, UserAdmin):
    add_form = JustfixUserCreationForm
    form = JustfixUserChangeForm
    model = JustfixUser
    ordering = ('-last_login',)
    list_filter = [
        'onboarding_info__signup_intent',
    ] + list(UserAdmin.list_filter)
    list_display = [
        'phone_number', 'username', 'first_name', 'last_name', 'last_login',
        'signup_intent',
    ]
    fieldsets = (
        ('Personal info', {'fields': (
            'first_name', 'last_name', 'email', 'is_email_verified',
            'phone_number', 'phone_number_lookup_details',
            'sms_conversations', 'locale',
        )}),
        ('Username and password', {
            'fields': ('username', 'password'),
            'description': (
                "Note that the username is never visible to users, but it is used to "
                "identify users in server logs. Therefore, it doesn't need to be "
                "very human-friendly, and ideally it should be devoid of any "
                "personally identifiable information such as a user's real name "
                "or phone number."
            )
        }),
        ('Additional read-only details', {
            'fields': ('rapidpro_contact_groups',),
            'description': (
                "Note that these details may be slightly out-of-date "
                "due to technical limitations."
            )
        }),
        (PERMISSIONS_LABEL, {'fields': ('is_active', 'is_staff', 'is_superuser',
                                        'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Product action information', {
            'fields': ('hp_action_info', 'loc_info', 'norent_info'),
        }),
    )
    non_superuser_fieldsets = tuple(
        (label, details) for label, details in fieldsets
        if label not in NON_SUPERUSER_FIELDSET_LABELS
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone_number', 'username', 'password1', 'password2'),
        }),
    )
    inlines = (
        LegacyUserInline,
        OnboardingInline,
        # We'll consider this part of the core user info b/c all our
        # flows ask for it, and it can be considered part of the user's
        # "core data".
        LandlordDetailsInline,
    )

    signup_intent = user_signup_intent

    search_fields = ['phone_number', *UserAdmin.search_fields]

    readonly_fields = [
        'hp_action_info',
        'loc_info',
        'norent_info',
        'phone_number_lookup_details',
        'rapidpro_contact_groups',
        'sms_conversations',
        *UserAdmin.readonly_fields
    ]

    def get_fieldsets(self, request, obj=None):
        if obj is not None and not request.user.is_superuser:
            return self.non_superuser_fieldsets
        return super().get_fieldsets(request, obj)

    def get_formsets_with_inlines(self, request, obj=None):
        for inline in self.get_inline_instances(request, obj):
            # Don't show the legacy user inline if they're not a legacy user.
            if (isinstance(inline, LegacyUserInline) and
                    not LegacyUserInfo.is_legacy_user(obj)):
                continue
            yield inline.get_formset(request, obj), inline

    hp_action_info = make_link_to_other_user_view(HPUser, "HP action information")

    loc_info = make_link_to_other_user_view(LOCUser, "Letter of complaint information")

    norent_info = make_link_to_other_user_view(NorentUser, "NoRent letter information")

    @admin_field(
        short_description="Rapidpro contact groups",
    )
    def rapidpro_contact_groups(self, obj):
        if obj is not None:
            groups = rapidpro.models.get_group_names_for_user(obj)
            if groups:
                return ', '.join(groups)

        return "None"

    @admin_field(
        short_description="SMS conversations",
    )
    def sms_conversations(self, obj):
        return make_button_link(
            f'/admin/conversations?phone=%2B1{obj.phone_number}',
            "SMS conversations"
        )

    def save_model(self, request, obj: JustfixUser, form, change):
        super().save_model(request, obj, form, change)
        airtable.sync.sync_user(obj)

    def phone_number_lookup_details(self, obj):
        return get_lookup_description_for_phone_number(obj.phone_number)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.prefetch_related('onboarding_info')


admin.site.register(JustfixUser, JustfixUserAdmin)
