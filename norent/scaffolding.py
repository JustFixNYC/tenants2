from typing import Optional
import pydantic

from .la_zipcodes import is_zip_code_in_la


# This should change whenever our scaffolding model's fields change.
VERSION = '1'


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
    "the bronx"
]


class NorentScaffolding(pydantic.BaseModel):
    '''
    This is just some scaffolding we have in place of an actual
    Django Model (or collection of models).  It allows us to get
    off the ground running without having to dedicate ourselves
    to a particular database schema.
    '''

    first_name: str = ''

    last_name: str = ''

    # e.g. "666 FIFTH AVENUE"
    street: str = ''

    city: str = ''

    # e.g. "NY"
    state: str = ''

    zip_code: str = ''

    apt_number: Optional[str] = None

    email: str = ''

    phone_number: str = ''

    landlord_name: str = ''

    # e.g. "666 FIFTH AVENUE, APT 2"
    landlord_primary_line: str = ''

    landlord_city: str = ''

    landlord_state: str = ''

    landlord_zip_code: str = ''

    landlord_email: str = ''

    landlord_phone_number: str = ''

    has_landlord_email_address: Optional[bool] = None

    has_landlord_mailing_address: Optional[bool] = None

    can_receive_rttc_comms: Optional[bool] = None

    can_receive_saje_comms: Optional[bool] = None

    def is_city_in_nyc(self) -> Optional[bool]:
        if not (self.state and self.city):
            return None
        return self.state == "NY" and self.city.lower() in NYC_CITIES

    def is_zip_code_in_la(self) -> Optional[bool]:
        if not self.zip_code:
            return None
        return is_zip_code_in_la(self.zip_code)
