import itertools
from typing import Union, Iterator, Optional
from django.contrib.gis.db import models
from django.contrib.gis.geos import GEOSGeometry, Point, Polygon, MultiPolygon
from django.contrib.gis.db.models.functions import Distance

from project import geocoding
from project.common_data import Choices
from users.models import PHONE_NUMBER_LEN, validate_phone_number


ORG_TYPE_CHOICES = Choices.from_file('findhelp-org-type-choices.json')


def to_multipolygon(geos_geom: Union[Polygon, MultiPolygon]) -> MultiPolygon:
    if isinstance(geos_geom, Polygon):
        return MultiPolygon(geos_geom)
    assert isinstance(geos_geom, MultiPolygon)
    return geos_geom


def union_geometries(geometries: Iterator[MultiPolygon]) -> Optional[MultiPolygon]:
    total_area = GEOSGeometry('POINT EMPTY', srid=4326)
    for geom in geometries:
        total_area = total_area.union(geom)
    if isinstance(total_area, Point):
        return None
    return to_multipolygon(total_area)


class IgnoreFindhelpMigrationsRouter:
    '''
    This is a database router that disables migrations related
    to models in this app.  It can be used if a Django project
    needs to optionally disable this app without necessarily
    making its models un-introspectable.
    '''

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label == 'findhelp':
            return False
        return True


class Zipcode(models.Model):
    class Meta:
        ordering = ['zipcode']

    zipcode = models.CharField(max_length=5, primary_key=True)
    geom = models.MultiPolygonField(srid=4326)

    def __str__(self):
        return self.zipcode


class Borough(models.Model):
    class Meta:
        ordering = ['code']

    code = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=20, unique=True)
    geom = models.MultiPolygonField(srid=4326)

    def __str__(self):
        return self.name


class Neighborhood(models.Model):
    class Meta:
        ordering = ['name', 'county']
        unique_together = ('name', 'county')

    name = models.CharField(max_length=50)
    county = models.CharField(max_length=20)
    geom = models.MultiPolygonField(srid=4326)

    def __str__(self):
        return f"{self.name} ({self.county})"


class CommunityDistrict(models.Model):
    class Meta:
        ordering = ['boro_cd']

    boro_cd = models.CharField(max_length=3, primary_key=True)
    name = models.CharField(max_length=80)
    geom = models.MultiPolygonField(srid=4326)

    BOROUGHS = {
        '1': 'Manhattan',
        '2': 'Bronx',
        '3': 'Brooklyn',
        '4': 'Queens',
        '5': 'Staten Island'
    }

    # https://www1.nyc.gov/site/planning/community/jias-sources.page
    JOINT_INTEREST_AREAS = {
        '164': 'Central Park',
        '226': 'Van Cortlandt Park',
        '227': 'Bronx Park',
        '228': 'Pelham Bay Park',
        '355': 'Prospect Park',
        '356': 'Brooklyn Gateway National Recreation Area',
        '480': 'LaGuardia Airport',
        '481': 'Flushing Meadows-Corona Park',
        '482': 'Forest Park',
        '483': 'JFK International Airport',
        '484': 'Queens Gateway National Recreation Area',
        '595': 'S.I. Gateway National Recreation Area'
    }

    @classmethod
    def boro_cd_to_name(cls, boro_cd: str) -> str:
        borough = cls.BOROUGHS[boro_cd[0]]
        num = int(boro_cd[1:])
        jia = cls.JOINT_INTEREST_AREAS.get(boro_cd)
        if jia:
            return f'{borough} JIA {num} ({jia})'
        return f'{borough} CD {num}'

    def __str__(self):
        return self.name


class TenantResourceManager(models.Manager):
    def find_best_for(self, latitude: float, longitude: float):
        origin = Point(longitude, latitude, srid=4326)
        return self.filter(
            catchment_area__contains=Point(longitude, latitude),
        ).annotate(distance=Distance('geocoded_point', origin)).order_by('distance')


class TenantResource(models.Model):
    name = models.CharField(max_length=150)
    website = models.URLField(blank=True)
    phone_number = models.CharField(
        'Phone number',
        max_length=PHONE_NUMBER_LEN,
        blank=True,
        validators=[validate_phone_number],
        help_text="A U.S. phone number without parentheses or hyphens, e.g. \"5551234567\"."
    )
    description = models.TextField(blank=True)
    org_type = models.CharField(
        max_length=40,
        blank=True,
        choices=ORG_TYPE_CHOICES.choices,
        help_text="The organization type."
    )
    address = models.TextField()
    zipcodes = models.ManyToManyField(Zipcode, blank=True)
    boroughs = models.ManyToManyField(Borough, blank=True)
    neighborhoods = models.ManyToManyField(Neighborhood, blank=True)
    community_districts = models.ManyToManyField(CommunityDistrict, blank=True)

    geocoded_address = models.TextField(blank=True)
    geocoded_point = models.PointField(null=True, blank=True, srid=4326)
    catchment_area = models.MultiPolygonField(null=True, blank=True, srid=4326)

    objects = TenantResourceManager()

    def __str__(self):
        return self.name

    def update_geocoded_info(self):
        results = geocoding.search(self.address)
        if results:
            result = results[0]
            self.geocoded_address = result.properties.label
            longitude, latitude = result.geometry.coordinates
            self.geocoded_point = Point(longitude, latitude)
        else:
            self.geocoded_address = ''
            self.geocoded_point = None

    def iter_geometries(self) -> Iterator[MultiPolygon]:
        regions = itertools.chain(
            self.zipcodes.all(),
            self.boroughs.all(),
            self.neighborhoods.all(),
            self.community_districts.all(),
        )
        for region in regions:
            yield region.geom

    def update_catchment_area(self):
        self.catchment_area = union_geometries(self.iter_geometries())

    def save(self, *args, **kwargs):
        if self.address != self.geocoded_address or not self.geocoded_point:
            self.update_geocoded_info()
        super().save(*args, **kwargs)
