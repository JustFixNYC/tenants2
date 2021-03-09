from django.contrib import admin

from project.util.admin_util import admin_field
from .models import Zipcode, Borough, Neighborhood, CommunityDistrict, TenantResource
from .admin_map import render_admin_map, admin_map_field, MapModelAdmin


@admin.register(Zipcode)
class ZipcodeAdmin(MapModelAdmin):
    list_display = ["zipcode"]
    search_fields = ["zipcode"]
    exclude = ["geom"]
    readonly_fields = ["geometry"]

    geometry = admin_map_field("geom", "Geometry")


@admin.register(Borough)
class BoroughAdmin(MapModelAdmin):
    list_display = ["code", "name"]
    exclude = ["geom"]
    readonly_fields = ["geometry"]

    geometry = admin_map_field("geom", "Geometry")


@admin.register(Neighborhood)
class NeighborhoodAdmin(MapModelAdmin):
    list_display = ["name", "county"]
    search_fields = ["name"]
    exclude = ["geom"]
    readonly_fields = ["geometry"]

    geometry = admin_map_field("geom", "Geometry")


@admin.register(CommunityDistrict)
class CommunityDistrictAdmin(MapModelAdmin):
    list_display = ["boro_cd", "name"]
    search_fields = ["name"]
    exclude = ["geom"]
    readonly_fields = ["geometry"]

    geometry = admin_map_field("geom", "Geometry")


@admin.register(TenantResource)
class TenantResourceAdmin(MapModelAdmin):
    list_display = ["name", "org_type"]
    exclude = ["geocoded_point", "catchment_area"]
    autocomplete_fields = ["zipcodes", "neighborhoods", "community_districts"]
    readonly_fields = ["geocoded_address", "location_and_catchment_area"]
    ordering = ("name",)
    search_fields = [
        "name",
        "org_type",
        "description",
        "zipcodes__zipcode",
        "boroughs__name",
        "neighborhoods__name",
    ]

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        obj = form.instance
        obj.update_catchment_area()
        obj.save()

    @admin_field(short_description="Location and catchment area", allow_tags=True)
    def location_and_catchment_area(self, obj) -> str:
        return render_admin_map(
            id="location_and_catchment_area",
            area=obj.catchment_area,
            point=obj.geocoded_point,
            point_label=obj.geocoded_address,
        )
