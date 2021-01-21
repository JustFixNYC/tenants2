from typing import Optional, Dict, List, NamedTuple, Tuple
import re
import urllib.parse
import pydantic
import logging
from django.conf import settings
import requests


logger = logging.getLogger(__name__)

MAPBOX_PLACES_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places"

MAPBOX_STATE_SHORT_CODE_RE = r"^US-([A-Z][A-Z])$"

MAPBOX_CITY_ID_RE = r"^(place|locality)\..*"


class MapboxFeatureContext(pydantic.BaseModel):
    id: str
    text: str
    short_code: Optional[str]


class MapboxFeature(pydantic.BaseModel):
    context: List[MapboxFeatureContext]
    text: str
    address: Optional[str]
    center: Tuple[float, float]
    place_type: List[str]


class MapboxResults(pydantic.BaseModel):
    features: List[MapboxFeature]


class StreetAddress(NamedTuple):
    address: str
    zip_code: str


def mapbox_places_request(query: str, args: Dict[str, str]) -> Optional[MapboxResults]:
    """
    Make a request for the given place to the Mapbox Places API [1], using the
    given arguments.

    Returns None if Mapbox isn't configured, or if a network error occurs.

    Note that Mapbox's Places API prohibits semicolons from
    being in the query, so this function will replace them with commas.

    [1] https://docs.mapbox.com/api/search/#forward-geocoding
    """

    if not settings.MAPBOX_ACCESS_TOKEN:
        return None

    query = query.replace(";", ",")

    try:
        response = requests.get(
            f"{MAPBOX_PLACES_URL}/{urllib.parse.quote(query)}.json",
            {
                "access_token": settings.MAPBOX_ACCESS_TOKEN,
                "country": "US",
                "autocomplete": "false",
                **args,
            },
            timeout=settings.MAPBOX_TIMEOUT,
        )
        if response.status_code == 422:
            # Unprocessable entity; our query was likely too long, so return
            # an empty result set.
            return MapboxResults(features=[])
        response.raise_for_status()
        return MapboxResults(**response.json())
    except Exception:
        logger.exception(f"Error while retrieving data from {MAPBOX_PLACES_URL}")
        return None


def find_city(city: str, state: str) -> Optional[List[Tuple[str, Tuple[float, float]]]]:
    """
    Attempts to find matches for the closest city name in the given
    state using the Mapbox Places API.  The return value is a list of
    (name, (lng, lat)) tuples in the given state that match the query.

    If Mapbox isn't configured or a network error occurs, returns None.
    """

    results = mapbox_places_request(
        f"{city}, {state}",
        {
            # We want "place" because it covers all cities, but we also want
            # "locality" so folks can enter places like "Brooklyn".
            "types": ",".join(["place", "locality"]),
        },
    )
    if not results:
        return None
    cities: List[Tuple[str, Tuple[float, float]]] = []
    for result in results.features:
        result_state = get_mapbox_state(result)
        if result_state == state:
            cities.append((result.text, result.center))
    return cities


def find_address(
    address: str, city: str, state: str, zip_code: str
) -> Optional[List[StreetAddress]]:
    """
    Attempts to find matches for the closest street address in the given
    city and state using the given zip code.

    If Mapbox isn't configured or a network error occurs, returns None.
    """

    city = city.strip()
    results = mapbox_places_request(
        f"{address}, {city}, {state} {zip_code}",
        {
            "types": "address",
        },
    )
    if not results:
        return None
    addrs: List[StreetAddress] = []
    for result in results.features:
        state_matches = get_mapbox_state(result) == state
        result_zip_code = get_mapbox_zip_code(result)
        if state_matches and result_zip_code and does_city_match(city, result):
            addrs.append(
                StreetAddress(address=get_mapbox_street_addr(result), zip_code=result_zip_code)
            )
    return addrs


def get_mapbox_street_addr(feature: MapboxFeature) -> str:
    """
    Given a Mapbox Feature that represents an address, returns
    the street address, e.g. "150 Court Street".
    """

    assert "address" in feature.place_type

    # Not really sure if any real-world addresses don't have the address
    # property, but the Mapbox docs do say it's optional...
    if feature.address:
        return f"{feature.address} {feature.text}"
    return feature.text


def get_state_from_short_code(short_code: Optional[str]) -> Optional[str]:
    """
    Given a Mapbox short code, returns the state it corresponds to.
    """

    if short_code == "pr":
        return "PR"
    match = re.match(MAPBOX_STATE_SHORT_CODE_RE, short_code or "")
    if match:
        return match[1]
    return None


def get_mapbox_state(feature: MapboxFeature) -> Optional[str]:
    """
    Returns the two-letter state code for the given Mapbox Feature, if
    one exists.
    """

    for context in feature.context:
        state = get_state_from_short_code(context.short_code)
        if state:
            return state
    return None


def get_mapbox_zip_code(feature: MapboxFeature) -> Optional[str]:
    """
    Returns the U.S. Zip Code for the given Mapbox Feature, if one
    exists.
    """

    for context in feature.context:
        if context.id.startswith("postcode."):
            return context.text
    return None


def does_city_match(city: str, feature: MapboxFeature) -> bool:
    """
    Returns whether the given Mapbox Feature is inside the given city.
    """

    for context in feature.context:
        if re.match(MAPBOX_CITY_ID_RE, context.id) and context.text.lower() == city.lower():
            return True
    return False
