import json
from typing import Optional, Any, Dict
from django.conf import settings
from django.contrib.gis.geos import Point, MultiPolygon
from django.template.loader import render_to_string
from django.contrib.admin import ModelAdmin
from django.utils import html

from project.util.admin_util import admin_field


# This must be the same as ADMIN_MAP_PREFIX in admin_map.js.
ADMIN_MAP_PREFIX = "admin-map-"


def render_admin_map(
    id: str,
    area: Optional[MultiPolygon] = None,
    point: Optional[Point] = None,
    point_label: Optional[str] = None,
) -> str:
    """
    Return HTML for a map containing the given area and/or the given point with
    the given label.
    """

    if not settings.MAPBOX_ACCESS_TOKEN:
        return "Unable to show map because Mapbox integration is disabled."

    if not (area or point):
        return "No map data to display."

    # Note that this should correspond to the AdminMapJsonParams interface
    # in admin_map_typings.d.ts.
    json_params: Dict[str, Any] = {
        "mapboxAccessToken": settings.MAPBOX_ACCESS_TOKEN,
        "mapboxTilesOrigin": settings.MAPBOX_TILES_ORIGIN,
        "zoomLevel": 13,
        "area": area and json.loads(area.geojson),
        "point": point and json.loads(point.geojson),
        "pointLabelHTML": html.escape(point_label),
    }

    return render_to_string(
        "findhelp/admin_map.html",
        {"json_params": json_params, "json_params_id": ADMIN_MAP_PREFIX + id},
    )


def admin_map_field(area_attr: str, short_description: str):
    """
    Return a function that can be used as a custom read-only
    Django admin field which displays a map based on the
    geometry from the given model attribute.
    """

    @admin_field(allow_tags=True, short_description=short_description)
    def field(self, obj) -> str:
        return render_admin_map(id=area_attr, area=getattr(obj, area_attr))

    return field


class MapModelAdmin(ModelAdmin):
    """
    A very simple subclass of ModelAdmin that can be used for displaying our
    maps. We're using this instead of GeoDjango's built-in GeoModelAdmin
    because it's not compatible with our Content Security Policy and we
    need more robust functionality anyways:

        https://github.com/JustFixNYC/tenants2/issues/459
    """

    class Media:
        css = {"all": ("findhelp/vendor/leaflet-1.4.0/leaflet.css", "findhelp/admin_map.css")}
        js = (
            "findhelp/vendor/leaflet-1.4.0/leaflet.js",
            "findhelp/admin_map.js",
        )
