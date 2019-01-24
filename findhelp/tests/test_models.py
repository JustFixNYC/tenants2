from findhelp.models import (
    to_multipolygon,
    Zipcode,
    TenantResource
)
from django.contrib.gis.geos import Polygon, MultiPolygon, Point


POLY_1 = Polygon.from_bbox((0, 0, 1, 1))
POLY_2 = Polygon.from_bbox((1, 1, 2, 2))

MPOLY_1 = to_multipolygon(POLY_1)
MPOLY_2 = to_multipolygon(POLY_2)


def test_to_multipolygon_converts_polygons():
    p = POLY_1
    mp = to_multipolygon(p)
    assert isinstance(mp, MultiPolygon)
    assert mp[0] == p


def test_to_multipolygon_passes_through_multipolygons():
    mp = MultiPolygon(POLY_1)
    assert to_multipolygon(mp) is mp


def test_zipcode_works(db):
    mp = MultiPolygon(POLY_1, POLY_2)
    zc = Zipcode(zipcode='11201', geom=mp)
    zc.save()
    assert str(zc) == '11201'


class TestTenantResourceManager:
    def test_it_finds_best_resources(self, db):
        zc1 = Zipcode(zipcode='11201', geom=MPOLY_1)
        zc1.save()
        zc2 = Zipcode(zipcode='11231', geom=MPOLY_2)
        zc2.save()

        tr1 = TenantResource(
            name='Funky Help', address='123 Funky Way', geocoded_point=Point(0.1, 0.1))
        tr1.save()
        tr1.zipcodes.set([zc1])
        tr1.update_catchment_area()
        tr1.save()

        tr2 = TenantResource(
            name='Awesome Help', address='123 Awesome Way', geocoded_point=Point(1.5, 1.5))
        tr2.save()
        tr2.zipcodes.set([zc2])
        tr2.update_catchment_area()
        tr2.save()

        tr3 = TenantResource(
            name='Ultra Help', address='123 Ultra Way', geocoded_point=Point(0.6, 0.6))
        tr3.save()
        tr3.zipcodes.set([zc1])
        tr3.update_catchment_area()
        tr3.save()

        resources = list(TenantResource.objects.find_best_for(0.5, 0.5))
        assert resources == [tr3, tr1]


class TestTenantResource:
    def test_it_updates_catchment_area_to_none(self, db):
        tr = TenantResource(name='Funky Help', address='123 Funky Way')
        tr.save()
        tr.update_catchment_area()
        assert tr.catchment_area is None

    def test_it_updates_catchment_area_to_multipolygon(self, db):
        zc1 = Zipcode(zipcode='11201', geom=MPOLY_1)
        zc1.save()
        tr = TenantResource(name='Funky Help', address='123 Funky Way')
        tr.save()
        tr.zipcodes.set([zc1])
        tr.update_catchment_area()
        assert isinstance(tr.catchment_area, MultiPolygon)
