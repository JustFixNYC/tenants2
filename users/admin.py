from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from .forms import JustfixUserCreationForm, JustfixUserChangeForm
from .models import JustfixUser
from onboarding.admin import OnboardingInline
from issues.admin import IssueInline, CustomIssueInline
import loc.admin


class JustfixUserAdmin(UserAdmin):
    add_form = JustfixUserCreationForm
    form = JustfixUserChangeForm
    model = JustfixUser
    list_display = ['full_name', 'phone_number']
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
    inlines = (OnboardingInline, IssueInline, CustomIssueInline) + loc.admin.user_inlines


admin.site.register(JustfixUser, JustfixUserAdmin)
