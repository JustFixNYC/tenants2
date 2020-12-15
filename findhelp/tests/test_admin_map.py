from types import SimpleNamespace
from django.contrib.gis.geos import Point, MultiPolygon, Polygon
import pytest

from findhelp.admin_map import render_admin_map, admin_map_field


MPOLY_1 = MultiPolygon(Polygon.from_bbox((0, 0, 1, 2)))


class MapboxEnabled:
    @pytest.fixture(autouse=True)
    def enable_mapbox(self, settings):
        settings.MAPBOX_ACCESS_TOKEN = "boop"


def test_render_admin_map_works_when_mapbox_is_disabled():
    assert "Mapbox integration is disabled" in render_admin_map("blah")


class TestRenderAdminMapWithMapboxEnabled(MapboxEnabled):
    def test_it_works_when_there_is_no_map_data_to_display(self):
        assert render_admin_map("blah") == "No map data to display."

    def test_it_returns_json_params(self, settings):
        html = render_admin_map(
            "blah", area=MPOLY_1, point=Point(5, 10), point_label="<Funky place"
        )
        assert 'id="admin-map-blah"' in html
        assert r"lt;Funky place" in html
        assert settings.MAPBOX_TILES_ORIGIN in html

        # The GeoJSON for the point.
        assert "[5.0, 10.0]" in html

        # Part of the GeoJSON for the area.
        assert "2.0" in html


class TestAdminMapField(MapboxEnabled):
    def test_it_works(self):
        f = admin_map_field("blarf", "funky field")

        assert f.short_description == "funky field"

        assert f(None, SimpleNamespace(blarf=None)) == "No map data to display."

        assert "admin-map-blarf" in f(None, SimpleNamespace(blarf=MPOLY_1))
