import json
from pathlib import Path
import requests_mock

from project import geocoding


MY_DIR = Path(__file__).parent.resolve()

EXAMPLE_SEARCH = json.loads((MY_DIR / 'test_geocoding_example_search.json').read_text())


def test_search_works():
    with requests_mock.Mocker() as m:
        m.get(geocoding.SEARCH_URL, json=EXAMPLE_SEARCH)
        results = geocoding.search("150 court")
        assert results[0].properties.label == "150 COURT STREET, Brooklyn, New York, NY, USA"
