import json
from typing import Optional, Tuple, Any, Dict
from django.conf import settings
from django.contrib.gis.geos import Point, MultiPolygon
from django.template.loader import render_to_string
from django.contrib.admin import ModelAdmin

from project.util.admin_util import admin_field


# This must be the same as ADMIN_MAP_PREFIX in admin_map.js.
ADMIN_MAP_PREFIX = "admin-map-"

LatLng = Tuple[float, float]


def find_center(area: Optional[MultiPolygon], point: Optional[Point]) -> Optional[LatLng]:
    center = None
    if area:
        center = area.centroid.coords
    if point:
        center = point.coords
    # Points are stored as (Longitude, Latitude) so we need to reverse them.
    return (center[1], center[0]) if center else None


def render_admin_map(
    id: str,
    area: Optional[MultiPolygon] = None,
    point: Optional[Point] = None,
    point_label: Optional[str] = None,
) -> str:
    if not settings.MAPBOX_ACCESS_TOKEN:
        return "Unable to show map because Mapbox integration is disabled."

    center = find_center(area, point)
    if not center:
        return "No map data to display."

    # Note that this should correspond to the AdminMapJsonParams interface
    # in admin_map_typings.d.ts.
    json_params: Dict[str, Any] = {
        'mapboxAccessToken': settings.MAPBOX_ACCESS_TOKEN,
        'mapboxTilesOrigin': settings.MAPBOX_TILES_ORIGIN,
        'center': center,
        'zoomLevel': 13,
        'area': area and json.loads(area.geojson),
        'point': point and json.loads(point.geojson),
        'pointLabel': point_label
    }

    return render_to_string('findhelp/admin_map.html', {
        'json_params': json_params,
        'json_params_id': ADMIN_MAP_PREFIX + id
    })


def admin_map_field(area_attr: str, short_description: str):
    @admin_field(allow_tags=True, short_description=short_description)
    def field(self, obj) -> str:
        return render_admin_map(
            id=area_attr,
            area=getattr(obj, area_attr)
        )

    return field


class MapModelAdmin(ModelAdmin):
    class Media:
        css = {
            'all': ("findhelp/vendor/leaflet-1.4.0/leaflet.css", "findhelp/admin_map.css")
        }
        js = ("findhelp/vendor/leaflet-1.4.0/leaflet.js", "findhelp/admin_map.js",)
