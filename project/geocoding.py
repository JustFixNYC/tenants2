from typing import List
import pydantic
import requests


SEARCH_URL = "https://geosearch.planninglabs.nyc/v1/search"


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


def search(text) -> List[Feature]:
    response = requests.get(SEARCH_URL, {'text': text})
    return [Feature(**kwargs) for kwargs in response.json()['features']]


if __name__ == '__main__':
    import sys
    for feature in search(sys.argv[1]):
        print(feature.properties.label)
