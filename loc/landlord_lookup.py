from typing import Optional, Any
from dataclasses import dataclass
import logging
import requests
import pydantic
from django.conf import settings

from project import geocoding


logger = logging.getLogger(__name__)


class ValidatingLandlordInfo(pydantic.BaseModel):
    '''
    This class is used internally to validate the JSON response we
    receive from the server.
    '''

    # The name of the landlord/business owner, e.g. "BOBBY DENVER"
    ownername: Optional[str]

    # The business address, e.g. "123 DOOMBRINGER STREET 4 11299"
    businessaddr: Optional[str]


@dataclass
class LandlordInfo:
    '''
    Landlord details extracted from the server.
    '''

    name: str

    address: str


def _extract_landlord_info(json_blob: Any) -> Optional[LandlordInfo]:
    # https://github.com/JustFixNYC/who-owns-what/pull/40
    result = json_blob['result']
    if result:
        info = ValidatingLandlordInfo(**result[0])

        # I'm not 100% sure, but I *think* it might be possible for both the
        # owner name and business address to be None, so let's make sure
        # that at least one of them has content.
        if info.ownername or info.businessaddr:
            return LandlordInfo(name=info.ownername or '',
                                address=info.businessaddr or '')
    return None


def lookup_landlord(address: str) -> Optional[LandlordInfo]:
    '''
    Looks up information about the landlord at the given address
    and returns it, or None if no information could be gleaned.
    '''

    features = geocoding.search(address)
    if not features:
        return None
    feature = features[0]
    url = settings.LANDLORD_LOOKUP_URL
    try:
        response = requests.get(
            url,
            {'bbl': feature.properties.pad_bbl},
            timeout=settings.LANDLORD_LOOKUP_TIMEOUT
        )
        if response.status_code != 200:
            raise Exception(f'Expected 200 response, got {response.status_code}')
        return _extract_landlord_info(response.json())
    except Exception:
        logger.exception(f'Error while retrieving data from {url}')
        return None

    return None
