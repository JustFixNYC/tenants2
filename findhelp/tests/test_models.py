from typing import Tuple, Dict, Any, List
from types import SimpleNamespace
import pytest

from findhelp.models import (
    geocoding,
    to_multipolygon,
    Zipcode,
    TenantResource
)
from django.contrib.gis.geos import Polygon, MultiPolygon


POLY_1 = Polygon.from_bbox((0, 0, 1, 1))
POLY_2 = Polygon.from_bbox((1, 1, 2, 2))


class FakeGeocoder:
    def __init__(self):
        self._registry: Dict[str, Tuple[float, float]] = {}

    def register(self, address, latitude, longitude) -> None:
        self._registry[address] = (longitude, latitude)

    def search(self, address: str) -> List[Any]:
        coords = self._registry.get(address)
        if coords is None:
            return []
        result = SimpleNamespace(
            properties=SimpleNamespace(label=address),
            geometry=SimpleNamespace(coordinates=coords)
        )
        return [result]


@pytest.fixture
def fake_geocoder(monkeypatch):
    fg = FakeGeocoder()
    monkeypatch.setattr(geocoding, 'search', fg.search)
    return fg


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
    def test_it_finds_best_resources(self, db, fake_geocoder):
        zc1 = create_zipcode(zipcode='11201', geom=POLY_1)
        zc2 = create_zipcode(zipcode='11231', geom=POLY_2)

        fake_geocoder.register('123 Funky Way', 0.1, 0.1)
        fake_geocoder.register('123 Awesome Way', 1.5, 1.5)
        fake_geocoder.register('123 Ultra Way', 0.6, 0.6)

        create_tenant_resource('Funky Help', '123 Funky Way', zipcodes=[zc1])
        create_tenant_resource('Awesome Help', '123 Awesome Way', zipcodes=[zc2])
        create_tenant_resource('Ultra Help', '123 Ultra Way', zipcodes=[zc1])

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

    def test_it_updates_geocoded_info_on_save(self, db, fake_geocoder):
        fake_geocoder.register('123 Funky Way', latitude=1, longitude=2)
        tr = create_tenant_resource(address='123 Blarg Way')

        assert tr.geocoded_address == ''
        assert tr.geocoded_point is None

        tr.address = '123 Funky Way'
        tr.save()

        assert tr.geocoded_address == '123 Funky Way'
        assert str(tr.geocoded_point) == 'SRID=4326;POINT (2 1)'
