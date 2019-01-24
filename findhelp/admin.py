from django.contrib.gis import admin
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
class TenantResourceAdmin(admin.GeoModelAdmin):
    autocomplete_fields = ['zipcodes', 'neighborhoods', 'community_districts']
    readonly_fields = [
        'geocoded_address', 'geocoded_latitude', 'geocoded_longitude', 'geocoded_point']

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        obj = form.instance
        obj.update_catchment_area()
        obj.save()
