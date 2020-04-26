from typing import Optional, Dict, List
import re
import urllib.parse
import pydantic
import logging
from django.conf import settings
import requests


logger = logging.getLogger(__name__)

MAPBOX_PLACES_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places"

MAPBOX_STATE_SHORT_CODE_RE = r"^US-([A-Z][A-Z])$"


class MapboxFeatureContext(pydantic.BaseModel):
    short_code: Optional[str]


class MapboxFeature(pydantic.BaseModel):
    context: List[MapboxFeatureContext]
    text: str


class MapboxResults(pydantic.BaseModel):
    features: List[MapboxFeature]


def mapbox_places_request(query: str, args: Dict[str, str]) -> Optional[MapboxResults]:
    '''
    Make a request for the given place to the Mapbox Places API, using the
    given arguments.

    Returns None if Mapbox isn't configured, or if a network error occurs.
    '''

    if not settings.MAPBOX_ACCESS_TOKEN:
        return None
    try:
        response = requests.get(
            f"{MAPBOX_PLACES_URL}/{urllib.parse.quote(query)}.json",
            {
                'access_token': settings.MAPBOX_ACCESS_TOKEN,
                'country': 'US',
                **args,
            },
            timeout=settings.MAPBOX_TIMEOUT
        )
        response.raise_for_status()
        return MapboxResults(**response.json())
    except Exception:
        logger.exception(f'Error while retrieving data from {MAPBOX_PLACES_URL}')
        return None


def find_city(city: str, state: str) -> Optional[List[str]]:
    '''
    Attempts to find the match for the closest city name in the given
    state using the Mapbox Places API.  The return value is a list of
    cities in the given state that match the query.

    If Mapbox isn't configured or a network error occurs, returns None.
    '''

    results = mapbox_places_request(f"{city}, {state}", {
        # We want "place" because it covers all cities, but we also want
        # "locality" so folks can enter places like "Brooklyn".
        'types': ','.join(["place", "locality"]),
    })
    if not results:
        return None
    cities: List[str] = []
    for result in results.features:
        result_state = get_mapbox_state(result)
        if result_state == state:
            cities.append(result.text)
    return cities


def get_mapbox_state(feature: MapboxFeature) -> Optional[str]:
    '''
    Returns the two-letter state code for the given Mapbox Feature, if
    one exists.
    '''

    for context in feature.context:
        match = re.match(MAPBOX_STATE_SHORT_CODE_RE, context.short_code or '')
        if match:
            return match[1]
    return None
