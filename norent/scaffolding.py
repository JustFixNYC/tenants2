import json
from findhelp.models import union_geometries
from pathlib import Path
from typing import Optional, Tuple
from django.contrib.gis.geos import GEOSGeometry, Point
import pydantic

from .la_zipcodes import is_zip_code_in_la


# This should change whenever our scaffolding model's fields change in a
# backwards incompatible way.
VERSION = "1"


NYC_CITIES = [
    "nyc",
    "new york city",
    "new york",
    "ny",
    "manhattan",
    "queens",
    "brooklyn",
    "staten island",
    "bronx",
    "the bronx",
]

BBOUNDS_PATH = Path("findhelp") / "data" / "Borough-Boundaries.geojson"

_nyc_bounds: Optional[GEOSGeometry] = None


def is_city_name_in_nyc(city: str) -> bool:
    parts = city.split("/")
    for part in parts:
        if part.strip().lower() in NYC_CITIES:
            return True
    return False


class NorentScaffolding(pydantic.BaseModel):
    """
    This is just some scaffolding we have in place of an actual
    Django Model (or collection of models).  It allows us to get
    off the ground running without having to dedicate ourselves
    to a particular database schema.
    """

    first_name: str = ""

    last_name: str = ""

    preferred_first_name: str = ""

    # e.g. "666 FIFTH AVENUE"
    street: str = ""

    city: str = ""

    # e.g. "NY"
    state: str = ""

    # If in NYC, the borough code, e.g. "STATEN_ISLAND".
    borough: str = ""

    # Whether or not we verified that the user's address was verified
    # on the server-side.
    address_verified: bool = False

    # e.g. (-73.9496, 40.6501)
    lnglat: Optional[Tuple[float, float]] = None

    zip_code: str = ""

    apt_number: Optional[str] = None

    email: str = ""

    phone_number: str = ""

    landlord_name: str = ""

    # e.g. "666 FIFTH AVENUE, APT 2"
    landlord_primary_line: str = ""

    landlord_city: str = ""

    landlord_state: str = ""

    landlord_zip_code: str = ""

    landlord_email: str = ""

    landlord_phone_number: str = ""

    has_landlord_email_address: Optional[bool] = None

    has_landlord_mailing_address: Optional[bool] = None

    can_receive_rttc_comms: Optional[bool] = None

    can_receive_saje_comms: Optional[bool] = None

    def is_city_in_nyc(self) -> Optional[bool]:
        if not (self.state and self.city):
            return None
        if self.state == "NY":
            if is_city_name_in_nyc(self.city):
                return True
            if self.lnglat and is_lnglat_in_nyc(self.lnglat):
                return True
        return False

    def is_zip_code_in_la(self) -> Optional[bool]:
        if not self.zip_code:
            return None
        return is_zip_code_in_la(self.zip_code)


def is_lnglat_in_nyc(lnglat: Tuple[float, float]) -> bool:
    global _nyc_bounds

    if _nyc_bounds is None:
        bbounds = json.loads(BBOUNDS_PATH.read_text())
        _nyc_bounds = union_geometries(
            GEOSGeometry(json.dumps(feature["geometry"])) for feature in bbounds["features"]
        )
        assert _nyc_bounds is not None
    return _nyc_bounds.contains(Point(*lnglat))
