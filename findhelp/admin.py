import json
from django.conf import settings
from django.contrib.gis import admin
from django.contrib.admin import ModelAdmin
from django.template.loader import render_to_string

from project.util.admin_util import admin_field
from .models import Zipcode, Borough, Neighborhood, CommunityDistrict, TenantResource


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
        js = ("findhelp/admin_map.js",)

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
    def location_and_catchment_area(self, obj):
        if not settings.MAPBOX_ACCESS_TOKEN:
            return "Unable to show map because Mapbox integration is disabled."
        if obj.id is None:
            return ""
        area = None
        if obj.catchment_area is not None:
            area = json.loads(obj.catchment_area.geojson)
        point = None
        if obj.geocoded_point is not None:
            point = json.loads(obj.geocoded_point.geojson)
        json_params = {
            'mapboxAccessToken': settings.MAPBOX_ACCESS_TOKEN,
            'area': area,
            'point': point,
            'pointLabel': obj.geocoded_address
        }
        json_params_id = 'admin-map-1'
        html = render_to_string('findhelp/admin_map.html', {
            'json_params': json_params,
            'json_params_id': json_params_id
        })
        return html
