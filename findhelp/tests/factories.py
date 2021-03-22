import factory
from django.contrib.gis.geos import Polygon

from findhelp.models import (
    Zipcode,
    Borough,
    Neighborhood,
    CommunityDistrict,
    TenantResource,
    County,
    to_multipolygon,
)


POLY_1 = Polygon.from_bbox((0, 0, 1, 1))
POLY_2 = Polygon.from_bbox((1, 1, 2, 2))


class CountyFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = County

    state = "NY"

    name = "Funkypants"

    geom = to_multipolygon(POLY_1)


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
