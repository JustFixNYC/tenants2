from findhelp.models import (
    to_multipolygon,
    union_geometries,
    IgnoreFindhelpMigrationsRouter,
    Zipcode,
    Borough,
    Neighborhood,
    CommunityDistrict,
    TenantResource,
    County,
)
from django.contrib.gis.geos import Polygon, MultiPolygon


POLY_1 = Polygon.from_bbox((0, 0, 1, 1))
POLY_2 = Polygon.from_bbox((1, 1, 2, 2))


def create_zipcode(zipcode="11201", geom=POLY_1):
    zc = Zipcode(zipcode=zipcode, geom=to_multipolygon(geom))
    zc.save()
    return zc


def create_borough(code=1, name="Manhattan", geom=POLY_1):
    borough = Borough(code=code, name=name, geom=to_multipolygon(geom))
    borough.save()
    return borough


def create_neighborhood(name="Dumbo", county="Kings", geom=POLY_1):
    neighborhood = Neighborhood(name=name, county=county, geom=to_multipolygon(geom))
    neighborhood.save()
    return neighborhood


def create_cd(boro_cd="164", name="Central Park", geom=POLY_1):
    cd = CommunityDistrict(boro_cd=boro_cd, name=name, geom=to_multipolygon(geom))
    cd.save()
    return cd


def create_tenant_resource(name="Funky Help", address="123 Funky Way", **kwargs):
    zipcodes = kwargs.pop("zipcodes", [])
    boroughs = kwargs.pop("boroughs", [])
    neighborhoods = kwargs.pop("neighborhoods", [])
    cds = kwargs.pop("community_districts", [])
    tr = TenantResource(name=name, address=address, **kwargs)
    tr.save()
    update = False
    if zipcodes:
        tr.zipcodes.set(zipcodes)
        update = True
    if boroughs:
        tr.boroughs.set(boroughs)
        update = True
    if neighborhoods:
        tr.neighborhoods.set(neighborhoods)
        update = True
    if cds:
        tr.community_districts.set(cds)
        update = True
    if update:
        tr.update_catchment_area()
        tr.save()
    return tr


def create_sample_tenant_resources(db, fake_geocoder):
    zc1 = create_zipcode(zipcode="11201", geom=POLY_1)
    zc2 = create_zipcode(zipcode="11231", geom=POLY_2)

    fake_geocoder.register("123 Funky Way", 0.1, 0.2)
    fake_geocoder.register("123 Awesome Way", 1.5, 1.5)
    fake_geocoder.register("123 Ultra Way", 0.6, 0.5)

    create_tenant_resource("Funky Help", "123 Funky Way", zipcodes=[zc1])
    create_tenant_resource("Awesome Help", "123 Awesome Way", zipcodes=[zc2])
    create_tenant_resource("Ultra Help", "123 Ultra Way", zipcodes=[zc1])


def test_to_multipolygon_converts_polygons():
    p = POLY_1
    mp = to_multipolygon(p)
    assert isinstance(mp, MultiPolygon)
    assert mp[0] == p


def test_to_multipolygon_passes_through_multipolygons():
    mp = MultiPolygon(POLY_1)
    assert to_multipolygon(mp) is mp


def test_zipcode_str_works():
    zc = Zipcode(zipcode="11201")
    assert str(zc) == "11201"


def test_borough_str_works():
    b = Borough(name="Staten Island")
    assert str(b) == "Staten Island"


def test_neighborhood_str_works():
    n = Neighborhood(name="Dumbo", county="Kings")
    assert str(n) == "Dumbo (Kings)"


def test_county_str_works():
    c = County(name="Franklin", state="OH")
    assert str(c) == "Franklin, OH"


class TestCommunityDistrict:
    def test_boro_cd_to_name_shows_joint_interest_areas(self):
        assert CommunityDistrict.boro_cd_to_name("164") == "Manhattan JIA 64 (Central Park)"

    def test_boro_cd_to_name_shows_community_districts(self):
        assert CommunityDistrict.boro_cd_to_name("36") == "Brooklyn CD 6"

    def test_str_works(self):
        cd = CommunityDistrict(name="Boop")
        assert str(cd) == "Boop"


class TestTenantResourceManager:
    def test_it_finds_best_resources(self, db, fake_geocoder):
        create_sample_tenant_resources(db, fake_geocoder)
        resources = list(tr.name for tr in TenantResource.objects.find_best_for(0.5, 0.5))
        assert resources == ["Ultra Help", "Funky Help"]


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
        fake_geocoder.register("123 Funky Way", latitude=1, longitude=2)
        tr = create_tenant_resource(address="123 Nonexistent address")

        assert tr.geocoded_address == ""
        assert tr.geocoded_point is None

        tr.address = "123 Funky Way"
        tr.save()

        assert tr.geocoded_address == "123 Funky Way"
        assert str(tr.geocoded_point) == "SRID=4326;POINT (2 1)"

        tr.address = "123 Nonexistent address"
        tr.save()

        assert tr.geocoded_address == ""
        assert tr.geocoded_point is None

    def test_iter_geometries_works(self, db):
        tr = create_tenant_resource()
        assert union_geometries(tr.iter_geometries()) is None

        zc = create_zipcode()
        tr = create_tenant_resource(zipcodes=[zc])
        assert union_geometries(tr.iter_geometries()) is not None

        borough = create_borough()
        tr = create_tenant_resource(boroughs=[borough])
        assert union_geometries(tr.iter_geometries()) is not None

        neighborhood = create_neighborhood()
        tr = create_tenant_resource(neighborhoods=[neighborhood])
        assert union_geometries(tr.iter_geometries()) is not None

        cd = create_cd()
        tr = create_tenant_resource(community_districts=[cd])
        assert union_geometries(tr.iter_geometries()) is not None


class TestIgnoreFindhelpMigrationsRouter:
    def test_it_returns_false_for_findhelp_models(self):
        router = IgnoreFindhelpMigrationsRouter()
        assert router.allow_migrate(None, app_label="findhelp") is False

    def test_it_returns_none_for_non_findhelp_models(self):
        router = IgnoreFindhelpMigrationsRouter()
        assert router.allow_migrate(None, app_label="blarg") is None
