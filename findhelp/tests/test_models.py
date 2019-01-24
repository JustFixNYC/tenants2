from findhelp.models import Zipcode, to_multipolygon
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
