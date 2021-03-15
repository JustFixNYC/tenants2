from typing import Tuple, Dict, Any, List
from types import SimpleNamespace
import pytest


class FakeGeocoder:
    def __init__(self):
        self._registry: Dict[str, Tuple[float, float]] = {}

    def register(self, address, latitude, longitude) -> None:
        self._registry[address] = (longitude, latitude)

    def search(self, address: str) -> List[Any]:
        coords = self._registry.get(address)
        if coords is None:
            return []
        result = SimpleNamespace(
            properties=SimpleNamespace(label=address), geometry=SimpleNamespace(coordinates=coords)
        )
        return [result]


@pytest.fixture
def fake_geocoder(monkeypatch):
    from findhelp.models import geocoding

    fg = FakeGeocoder()
    monkeypatch.setattr(geocoding, "search", fg.search)
    return fg
