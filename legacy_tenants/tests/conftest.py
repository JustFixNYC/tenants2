from unittest.mock import patch, MagicMock
import pytest

from .. import mongo


@pytest.fixture
def mock_mongodb(settings):
    settings.LEGACY_MONGODB_URL = 'mongodb://boop'
    settings.LEGACY_ORIGIN = 'https://fake-legacy-app'
    db = {
        'users': MagicMock(),
        'identities': MagicMock(),
        'advocates': MagicMock(),
        'tenants': MagicMock(),
        'autologins': MagicMock()
    }
    with patch.object(mongo, 'get_db') as get_db:
        get_db.return_value = db
        yield db
