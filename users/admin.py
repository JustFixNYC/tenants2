from django.db.models import Count, Q
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from project.util.admin_util import admin_field
from .forms import JustfixUserCreationForm, JustfixUserChangeForm
from .models import JustfixUser
from onboarding.admin import OnboardingInline
from issues.admin import IssueInline, CustomIssueInline
from loc.models import LOC_MAILING_CHOICES
import loc.admin


ISSUE_COUNT = "_issue_count"
MAILING_NEEDED = "_mailing_needed"


class JustfixUserAdmin(UserAdmin):
    add_form = JustfixUserCreationForm
    form = JustfixUserChangeForm
    model = JustfixUser
    list_display = ['phone_number', 'full_name', 'issue_count', 'mailing_needed']
    fieldsets = (
        (_('Personal info'), {'fields': ('full_name', 'email', 'phone_number')}),
        ('Username and password', {
            'fields': ('username', 'password'),
            'description': (
                "Note that the username is largely useless, and is an artifact of Django. "
                "We don't really use it anywhere, but nonetheless, it must exist, and it "
                "must be unique."
            )
        }),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser',
                                       'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone_number', 'username', 'password1', 'password2'),
        }),
    )
    inlines = (OnboardingInline, IssueInline, CustomIssueInline) + loc.admin.user_inlines

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
                filter=Q(letter_request__mail_choice=LOC_MAILING_CHOICES.WE_WILL_MAIL)
            )
        })
        return queryset


admin.site.register(JustfixUser, JustfixUserAdmin)
