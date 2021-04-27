from django.contrib import admin

from project.util.admin_util import admin_field

from findhelp.admin_map import render_admin_map
from .models import OnboardingInfo, AddressWithoutBoroughDiagnostic


class OnboardingInline(admin.StackedInline):
    model = OnboardingInfo
    verbose_name = "Onboarding info"
    verbose_name_plural = verbose_name
    exclude = ["address_verified", "geocoded_point", "geometry"]
    readonly_fields = [
        "geocoded_address",
        "geocoded_map",
        "pad_bbl",
        "pad_bin",
        "get_building_links_html",
    ]

    @admin_field(short_description="Geocoded map", allow_tags=True)
    def geocoded_map(self, obj) -> str:
        if not obj.geocoded_point:
            return "Sorry, not enough information to render map."
        return render_admin_map(
            id="location",
            area=None,
            point=obj.geocoded_point,
            point_label=obj.geocoded_address,
        )


@admin.register(AddressWithoutBoroughDiagnostic)
class AddressWithoutBoroughDiagnosticAdmin(admin.ModelAdmin):
    list_display = ["address", "created_at"]
