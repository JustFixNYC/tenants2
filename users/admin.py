from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from .forms import JustfixUserCreationForm, JustfixUserChangeForm
from .models import JustfixUser
from onboarding.admin import OnboardingInline


class JustfixUserAdmin(UserAdmin):
    add_form = JustfixUserCreationForm
    form = JustfixUserChangeForm
    model = JustfixUser
    list_display = ['full_name', 'phone_number']
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {'fields': ('full_name', 'email', 'phone_number')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser',
                                       'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    inlines = (OnboardingInline,)


admin.site.register(JustfixUser, JustfixUserAdmin)
