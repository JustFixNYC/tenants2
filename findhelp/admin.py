from django.contrib import admin

from project.util.admin_util import admin_field, never_has_permission
from .models import Zipcode, Borough, Neighborhood, CommunityDistrict, TenantResource, County
from .admin_map import render_admin_map, admin_map_field, MapModelAdmin


@admin.register(County)
class CountyAdmin(MapModelAdmin):
    list_display = ["name", "state"]
    search_fields = ["name"]
    exclude = ["geom"]
    readonly_fields = ["geometry"]

    geometry = admin_map_field("geom", "Geometry")

    has_add_permission = never_has_permission
    has_change_permission = never_has_permission
    has_delete_permission = never_has_permission


@admin.register(Zipcode)
class ZipcodeAdmin(MapModelAdmin):
    list_display = ["zipcode"]
    search_fields = ["zipcode"]
    exclude = ["geom"]
    readonly_fields = ["geometry"]

    geometry = admin_map_field("geom", "Geometry")

    has_add_permission = never_has_permission
    has_change_permission = never_has_permission
    has_delete_permission = never_has_permission


@admin.register(Borough)
class BoroughAdmin(MapModelAdmin):
    list_display = ["code", "name"]
    exclude = ["geom"]
    readonly_fields = ["geometry"]

    geometry = admin_map_field("geom", "Geometry")

    has_add_permission = never_has_permission
    has_change_permission = never_has_permission
    has_delete_permission = never_has_permission


@admin.register(Neighborhood)
class NeighborhoodAdmin(MapModelAdmin):
    list_display = ["name", "county"]
    search_fields = ["name"]
    exclude = ["geom"]
    readonly_fields = ["geometry"]

    geometry = admin_map_field("geom", "Geometry")

    has_add_permission = never_has_permission
    has_change_permission = never_has_permission
    has_delete_permission = never_has_permission


@admin.register(CommunityDistrict)
class CommunityDistrictAdmin(MapModelAdmin):
    list_display = ["boro_cd", "name"]
    search_fields = ["name"]
    exclude = ["geom"]
    readonly_fields = ["geometry"]

    geometry = admin_map_field("geom", "Geometry")

    has_add_permission = never_has_permission
    has_change_permission = never_has_permission
    has_delete_permission = never_has_permission


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
