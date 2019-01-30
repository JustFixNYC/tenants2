import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.gis.geos import Point

from findhelp.models import TenantResource, ORG_TYPE_CHOICES as ORG_TYPES


DATA_DIR = Path(__file__).parent.parent.parent.resolve() / 'data'

NYC_CBOS_GEOJSON = DATA_DIR / 'nyc_cbos.geojson'

ORG_TYPES_MAP = {
    'community': ORG_TYPES.COMMUNITY,
    'govt': ORG_TYPES.GOVERNMENT,
    'legal': ORG_TYPES.LEGAL
}


class Command(BaseCommand):
    help = (
        'Loads legacy community-based organization (CBO) data '
        'into the database as TenantResource models.'
    )

    @transaction.atomic
    def handle(self, *args, **options):
        geojson = json.load(NYC_CBOS_GEOJSON.open(encoding='utf-8'))
        for feature in geojson['features']:
            props = feature['properties']
            org_type = props['org_type']
            address = props['address']
            phone_number = str(props['contact_information'])
            longitude, latitude = feature['geometry']['coordinates']
            geocoded_point = Point(longitude, latitude)
            if org_type != '':
                org_type = ORG_TYPES_MAP[org_type]
            tr = TenantResource(
                name=props['organization'],
                website=props['website'],
                phone_number=phone_number,
                description=props['services'],
                org_type=org_type,
                address=address,
                geocoded_address=address,
                geocoded_point=geocoded_point
            )
            tr.full_clean()
            tr.save()

            # TODO: Add catchment area information.
