from django.contrib.gis import admin
from django.contrib.admin import ModelAdmin

from project.util.admin_util import admin_field
from .models import Zipcode, Borough, Neighborhood, CommunityDistrict, TenantResource
from .admin_map import render_admin_map


@admin.register(Zipcode)
class ZipcodeAdmin(admin.GeoModelAdmin):
    list_display = ['zipcode']
    search_fields = ['zipcode']


@admin.register(Borough)
class BoroughAdmin(admin.GeoModelAdmin):
    list_display = ['code', 'name']


@admin.register(Neighborhood)
class NeighborhoodAdmin(admin.GeoModelAdmin):
    list_display = ['name', 'county']
    search_fields = ['name']


@admin.register(CommunityDistrict)
class CommunityDistrictAdmin(admin.GeoModelAdmin):
    list_display = ['boro_cd', 'name']
    search_fields = ['name']


@admin.register(TenantResource)
class TenantResourceAdmin(ModelAdmin):
    class Media:
        css = {
            'all': ("findhelp/vendor/leaflet-1.4.0/leaflet.css", "findhelp/admin_map.css")
        }
        js = ("findhelp/vendor/leaflet-1.4.0/leaflet.js", "findhelp/admin_map.js",)

    exclude = ['geocoded_point', 'catchment_area']
    autocomplete_fields = ['zipcodes', 'neighborhoods', 'community_districts']
    readonly_fields = ['geocoded_address', 'location_and_catchment_area']

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        obj = form.instance
        obj.update_catchment_area()
        obj.save()

    @admin_field(
        short_description="Location and catchment area",
        allow_tags=True
    )
    def location_and_catchment_area(self, obj) -> str:
        return render_admin_map(
            id='location_and_catchment_area',
            area=obj.catchment_area,
            point=obj.geocoded_point,
            point_label=obj.geocoded_address
        )
