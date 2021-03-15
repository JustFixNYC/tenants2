from findhelp.models import (
    to_multipolygon,
    union_geometries,
    Zipcode,
    Borough,
    Neighborhood,
    CommunityDistrict,
    TenantResource,
    County,
)
from .factories import (
    POLY_1,
    create_borough,
    create_cd,
    create_neighborhood,
    create_sample_tenant_resources,
    create_tenant_resource,
    create_zipcode,
)
from django.contrib.gis.geos import MultiPolygon


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
