from django.db.models import Count
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from .forms import JustfixUserCreationForm, JustfixUserChangeForm
from .models import JustfixUser
from onboarding.admin import OnboardingInline
from issues.admin import IssueInline, CustomIssueInline
import loc.admin


ISSUE_COUNT = "_issue_count"


class JustfixUserAdmin(UserAdmin):
    add_form = JustfixUserCreationForm
    form = JustfixUserChangeForm
    model = JustfixUser
    list_display = ['phone_number', 'full_name', 'issue_count']
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

    def issue_count(self, obj):
        return getattr(obj, ISSUE_COUNT)
    issue_count.short_description = "Issues"  # type: ignore
    issue_count.admin_order_field = ISSUE_COUNT  # type: ignore

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(**{
            ISSUE_COUNT: Count('issues') + Count('custom_issues')
        })
        return queryset


admin.site.register(JustfixUser, JustfixUserAdmin)
