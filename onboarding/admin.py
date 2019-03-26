from django.contrib import admin

from .models import OnboardingInfo, AddressWithoutBoroughDiagnostic


class OnboardingInline(admin.StackedInline):
    model = OnboardingInfo
    verbose_name = "Onboarding info"
    verbose_name_plural = verbose_name


@admin.register(AddressWithoutBoroughDiagnostic)
class AddressWithoutBoroughDiagnosticAdmin(admin.ModelAdmin):
    list_display = ['address', 'created_at']
