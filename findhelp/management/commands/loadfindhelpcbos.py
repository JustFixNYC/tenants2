import json
from pathlib import Path
from typing import List
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.gis.geos import Point

from findhelp.models import (
    ORG_TYPE_CHOICES as ORG_TYPES,
    Zipcode,
    CommunityDistrict,
    Borough,
    Neighborhood,
    TenantResource,
)


DATA_DIR = Path(__file__).parent.parent.parent.resolve() / "data"

NYC_CBOS_GEOJSON = DATA_DIR / "nyc_cbos.geojson"

ORG_TYPES_MAP = {
    "community": ORG_TYPES.COMMUNITY,
    "govt": ORG_TYPES.GOVERNMENT,
    "legal": ORG_TYPES.LEGAL,
}


BOROUGH = "borough"
NEIGHBORHOOD = "neighborhood"
COUNCIL = "council"
ZIPCODE = "zipcode"
COMMUNITY_BOARD = "community_board"
SERVICE_AREA_TYPES = set([BOROUGH, NEIGHBORHOOD, COUNCIL, ZIPCODE, COMMUNITY_BOARD])


def strip_csv(val: str) -> List[str]:
    return [item.strip() for item in val.split(",")]


class Command(BaseCommand):
    help = (
        "Loads legacy community-based organization (CBO) data "
        "into the database as TenantResource models."
    )

    @transaction.atomic
    def handle(self, *args, **options):
        geojson = json.load(NYC_CBOS_GEOJSON.open(encoding="utf-8"))
        for feature in geojson["features"]:
            props = feature["properties"]
            satype = props["service_area_type"]
            assert satype in SERVICE_AREA_TYPES

            if satype == COUNCIL:
                # Just ignore city council members for now.
                continue

            name = props["organization"]
            print(f"Adding {name}.")

            org_type = props["org_type"]
            address = props["address"]
            phone_number = str(props["contact_information"])
            longitude, latitude = feature["geometry"]["coordinates"]
            geocoded_point = Point(longitude, latitude)
            if org_type != "":
                org_type = ORG_TYPES_MAP[org_type]
            tr = TenantResource(
                name=name,
                website=props["website"],
                phone_number=phone_number,
                description=props["services"],
                org_type=org_type,
                address=address,
                geocoded_address=address,
                geocoded_point=geocoded_point,
            )
            tr.full_clean()
            tr.save()

            if satype == BOROUGH:
                borough = Borough.objects.get(name__iexact=props["borough"])
                tr.boroughs.set([borough])
            elif satype == NEIGHBORHOOD:
                hoods: List[Neighborhood] = []
                for hood in strip_csv(props["neighborhoods"]):
                    # Apparently "Clinton" is an alternate name for "Hell's Kitchen",
                    # and that's the one in our DB?
                    # https://en.wikipedia.org/wiki/Hell%27s_Kitchen,_Manhattan
                    if hood == "Hell's Kitchen":
                        hood = "Clinton"
                    # It looks like Ditmars Steinway is part of Astoria:
                    # https://en.wikipedia.org/wiki/Astoria,_Queens#Ditmars
                    if hood == "Ditmars Steinway":
                        hood = "Astoria"
                    # Cypress Hills is a subsection of East New York:
                    # https://en.wikipedia.org/wiki/East_New_York,_Brooklyn#Cypress_Hills
                    if hood == "Cypress Hills":
                        hood = "East New York"
                    # Apparently "Hunters Point is the neighborhood most people mean when
                    # they say Long Island City":
                    # https://www.tripsavvy.com/hunters-point-long-island-city-2819274
                    if hood == "Long Island City":
                        hood = "Hunters Point"
                    # I guess Two Bridges is part of LES:
                    # https://en.wikipedia.org/wiki/Two_Bridges,_Manhattan
                    if hood == "Two Bridges":
                        hood = "Lower East Side"
                    if hood == "Bedford-Stuyvesant":
                        hood = "Bedford Stuyvesant"
                    if hood == "Prospect-Lefferts Gardens":
                        hood = "Prospect Lefferts Gardens"
                    if hood == "Sunnyside":
                        # This is for Central Astoria Local Development Coalition, so it's
                        # the Sunnyside in Queens, not the one in Staten Island.
                        hoods.append(Neighborhood.objects.get(name="Sunnyside", county="Queens"))
                    else:
                        hoods.append(Neighborhood.objects.get(name__iexact=hood))
                tr.neighborhoods.set(hoods)
            elif satype == ZIPCODE:
                zipcodes: List[Zipcode] = []
                for zipcode in strip_csv(props["zipcodes"]):
                    assert len(zipcode) == 5
                    zipcodes.append(Zipcode.objects.get(zipcode=zipcode))
                tr.zipcodes.set(zipcodes)
            else:
                assert satype == COMMUNITY_BOARD
                borough = Borough.objects.get(name__iexact=props["borough"])
                cbs: List[CommunityDistrict] = []
                for cb in strip_csv(props["community_boards"]):
                    boro_cd = f"{borough.code}{cb.zfill(2)}"
                    cbs.append(CommunityDistrict.objects.get(boro_cd=boro_cd))
                tr.community_districts.set(cbs)

            tr.update_catchment_area()
            tr.save()
