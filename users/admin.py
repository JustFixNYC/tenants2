from django.db.models import Count, Q
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.urls import reverse
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from project.util.admin_util import admin_field
from .forms import JustfixUserCreationForm, JustfixUserChangeForm
from .models import JustfixUser
import rapidpro.models
from onboarding.admin import OnboardingInline
from issues.admin import IssueInline, CustomIssueInline
from legacy_tenants.admin import LegacyUserInline
from legacy_tenants.models import LegacyUserInfo
from loc.models import LOC_MAILING_CHOICES
from texting.models import get_lookup_description_for_phone_number
import loc.admin
import airtable.sync


ISSUE_COUNT = "_issue_count"
MAILING_NEEDED = "_mailing_needed"
PERMISSIONS_LABEL = _('Permissions')
NON_SUPERUSER_FIELDSET_LABELS = (PERMISSIONS_LABEL,)


class JustfixUserAdmin(airtable.sync.SyncUserOnSaveMixin, UserAdmin):
    add_form = JustfixUserCreationForm
    form = JustfixUserChangeForm
    model = JustfixUser
    ordering = ('-last_login',)
    list_filter = [
        'letter_request__mail_choice'
    ] + list(UserAdmin.list_filter)
    list_display = [
        'phone_number', 'username', 'first_name', 'last_name', 'last_login',
        'issue_count', 'mailing_needed'
    ]
    fieldsets = (
        (_('Personal info'), {'fields': (
            'first_name', 'last_name', 'email', 'is_email_verified',
            'phone_number', 'phone_number_lookup_details'
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
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
        ('HP action information', {
            'fields': ('hp_action_info',),
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
        IssueInline,
        CustomIssueInline,
    ) + loc.admin.user_inlines

    actions = UserAdmin.actions + [loc.admin.print_loc_envelopes]

    search_fields = ['phone_number', *UserAdmin.search_fields]

    readonly_fields = [
        'hp_action_info',
        'phone_number_lookup_details',
        'rapidpro_contact_groups',
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

    @admin_field(
        short_description="HP action information",
        allow_tags=True
    )
    def hp_action_info(self, obj):
        url = reverse('admin:hpaction_hpuser_change', args=[obj.pk])
        return format_html('<a class="button" href="{}">View/edit HP action information</a>', url)

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
        short_description="Issues",
        admin_order_field=ISSUE_COUNT
    )
    def issue_count(self, obj):
        return getattr(obj, ISSUE_COUNT)

    @admin_field(
        short_description="Letter mailing needed?",
        admin_order_field=MAILING_NEEDED
    )
    def mailing_needed(self, obj) -> bool:
        return bool(getattr(obj, MAILING_NEEDED))

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(**{
            ISSUE_COUNT: (
                Count('issues', distinct=True) +
                Count('custom_issues', distinct=True)
            ),
            MAILING_NEEDED: Count(
                'letter_request',
                distinct=True,
                filter=(
                    Q(letter_request__mail_choice=LOC_MAILING_CHOICES.WE_WILL_MAIL) &
                    Q(letter_request__tracking_number__exact='') &
                    Q(letter_request__rejection_reason__exact='')
                )
            )
        })
        return queryset

    def save_model(self, request, obj: JustfixUser, form, change):
        super().save_model(request, obj, form, change)
        airtable.sync.sync_user(obj)

    def phone_number_lookup_details(self, obj):
        return get_lookup_description_for_phone_number(obj.phone_number)


admin.site.register(JustfixUser, JustfixUserAdmin)
