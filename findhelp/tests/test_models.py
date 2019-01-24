from findhelp.models import (
    to_multipolygon,
    Zipcode,
    TenantResource
)
from django.contrib.gis.geos import Polygon, MultiPolygon


TUPLE_1 = ((0, 0), (0, 1), (1, 1), (0, 0))
TUPLE_2 = ((1, 1), (1, 2), (2, 2), (1, 1))


def test_to_multipolygon_converts_polygons():
    p = Polygon(TUPLE_1)
    mp = to_multipolygon(p)
    assert isinstance(mp, MultiPolygon)
    assert mp[0] == p


def test_to_multipolygon_passes_through_multipolygons():
    mp = MultiPolygon(Polygon(TUPLE_1))
    assert to_multipolygon(mp) is mp


def test_zipcode_works(db):
    mp = MultiPolygon(Polygon(TUPLE_1), Polygon(TUPLE_2))
    zc = Zipcode(zipcode='11201', geom=mp)
    zc.save()
    assert str(zc) == '11201'


class TestTenantResource:
    def test_it_updates_catchment_area_to_none(self, db):
        tr = TenantResource(name='Funky Help', address='123 Funky Way')
        tr.save()
        tr.update_catchment_area()
        assert tr.catchment_area is None

    def test_it_updates_catchment_area_to_multipolygon(self, db):
        zc1 = Zipcode(zipcode='11201', geom=to_multipolygon(Polygon(TUPLE_1)))
        zc1.save()
        tr = TenantResource(name='Funky Help', address='123 Funky Way')
        tr.save()
        tr.zipcodes.set([zc1])
        tr.update_catchment_area()
        assert isinstance(tr.catchment_area, MultiPolygon)
