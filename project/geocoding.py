from typing import List, Optional
import logging
import pydantic
import requests
from django.conf import settings


logger = logging.getLogger(__name__)


class FeatureGeometry(pydantic.BaseModel):
    # This is generally "Point".
    type: str

    # The latitude and longitude.
    coordinates: List[float]


class FeatureProperties(pydantic.BaseModel):
    # The ZIP code, e.g. "11201".
    postalcode: str

    # The name, e.g. "666 FIFTH AVENUE".
    name: str

    # The region, e.g. "New York State".
    region: str

    # The locality, e.g. "New York".
    locality: str

    # The borough, e.g. "Manhattan"
    borough: str

    # e.g. "whosonfirst:borough:2"
    borough_gid: str

    # The full address, e.g. "666 FIFTH AVENUE, Manhattan, New York, NY, USA"
    label: str

    # The borough, block, lot number of the address, e.g. "3002920026".
    pad_bbl: str


class Feature(pydantic.BaseModel):
    # This is generally "Feature".
    type: str

    geometry: FeatureGeometry

    properties: FeatureProperties


def search(text: str) -> Optional[List[Feature]]:
    '''
    Retrieves geo search results for the given search
    criteria. For more details, see:

        https://geosearch.planninglabs.nyc/docs/#search

    If any errors occur, this function will log an
    exception and return None.
    '''

    if not settings.GEOCODING_SEARCH_URL:
        # Geocoding is disabled.
        return None

    try:
        response = requests.get(
            settings.GEOCODING_SEARCH_URL,
            {'text': text},
            timeout=settings.GEOCODING_TIMEOUT
        )
        if response.status_code != 200:
            raise Exception(f'Expected 200 response, got {response.status_code}')
        return [Feature(**kwargs) for kwargs in response.json()['features']]
    except Exception:
        logger.exception(f'Error while retrieving data from {settings.GEOCODING_SEARCH_URL}')
        return None
