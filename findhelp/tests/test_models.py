from findhelp.models import (
    to_multipolygon,
    Zipcode,
    TenantResource
)
from django.contrib.gis.geos import Polygon, MultiPolygon, Point


POLY_1 = Polygon.from_bbox((0, 0, 1, 1))
POLY_2 = Polygon.from_bbox((1, 1, 2, 2))


def create_zipcode(zipcode='11201', geom=POLY_1):
    zc = Zipcode(zipcode=zipcode, geom=to_multipolygon(geom))
    zc.save()
    return zc


def create_tenant_resource(name='Funky Help', address='123 Funky Way', **kwargs):
    zipcodes = kwargs.pop('zipcodes', [])
    tr = TenantResource(name=name, address=address, **kwargs)
    tr.save()
    update = False
    if zipcodes:
        tr.zipcodes.set(zipcodes)
        update = True
    if update:
        tr.update_catchment_area()
        tr.save()
    return tr


def test_to_multipolygon_converts_polygons():
    p = POLY_1
    mp = to_multipolygon(p)
    assert isinstance(mp, MultiPolygon)
    assert mp[0] == p


def test_to_multipolygon_passes_through_multipolygons():
    mp = MultiPolygon(POLY_1)
    assert to_multipolygon(mp) is mp


def test_zipcode_str_works():
    zc = Zipcode(zipcode='11201')
    assert str(zc) == '11201'


class TestTenantResourceManager:
    def test_it_finds_best_resources(self, db):
        zc1 = create_zipcode(zipcode='11201', geom=POLY_1)
        zc2 = create_zipcode(zipcode='11231', geom=POLY_2)

        create_tenant_resource(
            name='Funky Help', address='123 Funky Way', geocoded_point=Point(0.1, 0.1),
            zipcodes=[zc1])

        create_tenant_resource(
            name='Awesome Help', address='123 Awesome Way', geocoded_point=Point(1.5, 1.5),
            zipcodes=[zc2])

        create_tenant_resource(
            name='Ultra Help', address='123 Ultra Way', geocoded_point=Point(0.6, 0.6),
            zipcodes=[zc1])

        resources = list(tr.name for tr in TenantResource.objects.find_best_for(0.5, 0.5))
        assert resources == ['Ultra Help', 'Funky Help']


class TestTenantResource:
    def test_it_updates_catchment_area_to_none(self, db):
        tr = create_tenant_resource()
        tr.update_catchment_area()
        assert tr.catchment_area is None

    def test_it_updates_catchment_area_to_multipolygon(self, db):
        zc = create_zipcode()
        tr = create_tenant_resource(zipcodes=[zc])
        tr.update_catchment_area()
        assert isinstance(tr.catchment_area, MultiPolygon)
