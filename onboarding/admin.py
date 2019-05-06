from django.contrib import admin

from .models import OnboardingInfo, AddressWithoutBoroughDiagnostic
from project.util.admin_util import admin_field


class OnboardingInline(admin.StackedInline):
    model = OnboardingInfo
    verbose_name = "Onboarding info"
    verbose_name_plural = verbose_name

    readonly_fields = ['building_links']

    @admin_field(short_description='Building links', allow_tags=True)
    def building_links(self, obj: OnboardingInfo) -> str:
        return obj.building_links_html


@admin.register(AddressWithoutBoroughDiagnostic)
class AddressWithoutBoroughDiagnosticAdmin(admin.ModelAdmin):
    list_display = ['address', 'created_at']
