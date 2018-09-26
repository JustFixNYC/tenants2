from typing import Optional
import logging
import requests
import pydantic
from django.conf import settings

from project import geocoding


logger = logging.getLogger(__name__)


class LandlordInfo(pydantic.BaseModel):
    # The name of the landlord/business owner, e.g. "BOBBY DENVER"
    ownername: str

    # The business address, e.g. "123 DOOMBRINGER STREET 4 11299"
    businessaddr: Optional[str]


def lookup_landlord(address: str) -> Optional[LandlordInfo]:
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
        # https://github.com/JustFixNYC/who-owns-what/pull/40
        result = response.json()['result']
        if result:
            return LandlordInfo(**result[0])
    except Exception:
        logger.exception(f'Error while retrieving data from {url}')
        return None

    return None
