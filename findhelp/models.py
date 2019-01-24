from django.contrib.gis.db import models
from django.contrib.gis.geos import GEOSGeometry, Point, Polygon, MultiPolygon
from django.contrib.gis.db.models.functions import Distance

from project import geocoding


def to_multipolygon(geos_geom):
    if isinstance(geos_geom, Polygon):
        return MultiPolygon(geos_geom)
    assert isinstance(geos_geom, MultiPolygon)
    return geos_geom


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
    name = models.CharField(max_length=100)
    address = models.TextField()
    zipcodes = models.ManyToManyField(Zipcode, blank=True)
    boroughs = models.ManyToManyField(Borough, blank=True)
    neighborhoods = models.ManyToManyField(Neighborhood, blank=True)
    community_districts = models.ManyToManyField(CommunityDistrict, blank=True)

    geocoded_address = models.TextField(blank=True)
    geocoded_latitude = models.FloatField(default=0.0)
    geocoded_longitude = models.FloatField(default=0.0)
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
            self.geocoded_latitude = latitude
            self.geocoded_longitude = longitude
            self.geocoded_point = Point(longitude, latitude)

    def update_catchment_area(self):
        total_area = GEOSGeometry('POINT EMPTY', srid=4326)
        for zipcode in self.zipcodes.all():
            total_area = total_area.union(zipcode.geom)
        for borough in self.boroughs.all():
            total_area = total_area.union(borough.geom)
        for hood in self.neighborhoods.all():
            total_area = total_area.union(hood.geom)
        for cd in self.community_districts.all():
            total_area = total_area.union(cd.geom)
        if isinstance(total_area, Point):
            self.catchment_area = None
        else:
            self.catchment_area = to_multipolygon(total_area)

    def save(self, *args, **kwargs):
        if self.address != self.geocoded_address or not self.geocoded_point:
            self.update_geocoded_info()
        super().save(*args, **kwargs)
