from typing import List, Optional
import pydantic
import requests
import logging


SEARCH_URL = "https://geosearch.planninglabs.nyc/v1/search"

SEARCH_TIMEOUT = 3

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

    # The full address, e.g. "666 FIFTH AVENUE, Manhattan, New York, NY, USA"
    label: str


class Feature(pydantic.BaseModel):
    # This is generally "Feature".
    type: str

    geometry: FeatureGeometry

    properties: FeatureProperties


def search(text) -> Optional[List[Feature]]:
    '''
    Retrieves geo search results for the given search
    criteria. For more details, see:

        https://geosearch.planninglabs.nyc/docs/#search

    If any errors occur, this function will log an
    exception and return None.
    '''

    try:
        response = requests.get(SEARCH_URL, {'text': text}, timeout=SEARCH_TIMEOUT)
        if response.status_code != 200:
            raise Exception(f'Expected 200 response, got {response.status_code}')
        return [Feature(**kwargs) for kwargs in response.json()['features']]
    except Exception:
        logger.exception(f'Error while retrieving data from {SEARCH_URL}')
        return None


if __name__ == '__main__':
    import sys
    features = search(sys.argv[1])
    if features is None:
        print("Geosearch failed, exiting.")
        sys.exit(1)
    for feature in features:
        print(feature.properties.label)
