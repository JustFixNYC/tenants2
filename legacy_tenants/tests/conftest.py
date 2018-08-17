from unittest.mock import patch, MagicMock
import pytest

from .. import mongo


@pytest.fixture
def mock_mongodb():
    db = {
        'users': MagicMock(),
        'identities': MagicMock(),
        'advocates': MagicMock(),
        'tenants': MagicMock()
    }
    with patch.object(mongo, 'get_db') as get_db:
        get_db.return_value = db
        yield db
