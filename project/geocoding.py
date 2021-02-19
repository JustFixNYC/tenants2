from typing import List, Optional
import logging
import pydantic
import requests
from django.conf import settings

from project.util.geojson import FeatureGeometry


logger = logging.getLogger(__name__)


class FeatureProperties(pydantic.BaseModel):
    # The ZIP code, e.g. "11201". For some reason this isn't present in
    # a minority of addresses, such as "276 M L K Boulevard, Manhattan".
    postalcode: Optional[str]

    # The name, e.g. "666 FIFTH AVENUE".
    name: str

    # The street, e.g. "FIFTH AVENUE".
    street: str

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

    # The building identification number of the address, e.g. "3003069".
    pad_bin: str


class Feature(pydantic.BaseModel):
    # This is generally "Feature".
    type: str

    geometry: FeatureGeometry

    properties: FeatureProperties


def _log_replacements(old: List[Feature], new: List[Feature]) -> None:
    """
    Log an informational message if we modify the default geocoding results
    for diagnostic purposes.

    Attempt to keep PII out of logs by not including the house number.
    """

    if old and new:
        np = new[0].properties
        op = old[0].properties
        nstr = f"{np.street} {np.borough}"
        ostr = f"{op.street} {op.borough}"
        if nstr != ostr:
            logger.info(f"Promoting {nstr} over {ostr}.")


def _promote_exact_address(search_text: str, features: List[Feature]) -> List[Feature]:
    """
    If the given search text specifies a borough and one or more of the
    given features match the search text and borough *exactly*, promote
    them to the top of the list.

    This is actually a workaround for an apparent flaw in
    GeoSearch/Pelias whereby it sometimes, for some reason, promotes
    non-exact matches over exact ones.
    """

    exact_matches: List[Feature] = []
    other_matches: List[Feature] = []

    for feature in features:
        p = feature.properties
        addr_with_borough = f"{p.name}, {p.borough}"
        if addr_with_borough.lower() == search_text.lower():
            exact_matches.append(feature)
        else:
            other_matches.append(feature)

    return exact_matches + other_matches


def _promote_same_borough(search_text: str, features: List[Feature]) -> List[Feature]:
    """
    If the given search text specifies a borough, push
    features in the given list that share that borough
    above features that don't.

    This is actually a workaround for an apparent flaw in
    GeoSearch/Pelias whereby specifying the borough name for
    an address, e.g. "100 FIFTH AVENUE, Manhattan", doesn't
    explicity promote it above an identical address in a
    different borough, e.g. "100 FIFTH AVENUE, Brooklyn". So
    we're going to try to do that manually.
    """

    # We're not guaranteed that the borough is the last part
    # of the search text after a comma, but if it's not, that
    # should be okay since we will just never match against
    # the borough of a Feature.
    maybe_borough = search_text.split(",")[-1].strip().lower()

    same_borough: List[Feature] = []
    other_boroughs: List[Feature] = []
    for feature in features:
        if feature.properties.borough.lower() == maybe_borough:
            same_borough.append(feature)
        else:
            other_boroughs.append(feature)

    new_features = same_borough + other_boroughs
    _log_replacements(features, new_features)
    return new_features


def search(text: str) -> Optional[List[Feature]]:
    """
    Retrieves geo search results for the given search
    criteria. For more details, see:

        https://geosearch.planninglabs.nyc/docs/#search

    If any errors occur, this function will log an
    exception and return None.
    """

    if not settings.GEOCODING_SEARCH_URL:
        # Geocoding is disabled.
        return None

    try:
        response = requests.get(
            settings.GEOCODING_SEARCH_URL, {"text": text}, timeout=settings.GEOCODING_TIMEOUT
        )
        if response.status_code != 200:
            raise Exception(f"Expected 200 response, got {response.status_code}")
        features = [Feature(**kwargs) for kwargs in response.json()["features"]]
    except pydantic.ValidationError:
        logger.exception(
            f"Validation error processing response from {settings.GEOCODING_SEARCH_URL} "
            f"for input {repr(text)}"
        )
        return None
    except Exception:
        logger.exception(f"Error while retrieving data from {settings.GEOCODING_SEARCH_URL}")
        return None

    return _promote_exact_address(text, _promote_same_borough(text, features))
