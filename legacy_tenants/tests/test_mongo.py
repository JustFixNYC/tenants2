from unittest.mock import patch, MagicMock
import pytest

from .. import mongo
from .example_legacy_data import TENANT, ADVOCATE, IDENTITY


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


def test_is_rent_stabilized_works():
    tenant = mongo.MongoTenant(**{**TENANT, 'actionFlags': []})
    assert tenant.isRentStabilized is False

    tenant = mongo.MongoTenant(**{**TENANT, 'actionFlags': ['isRentStabilized']})
    assert tenant.isRentStabilized is True


def test_is_harassment_eligible_works():
    tenant = mongo.MongoTenant(**{**TENANT, 'actionFlags': []})
    assert tenant.isHarassmentEligible is False

    tenant = mongo.MongoTenant(**{**TENANT, 'actionFlags': ['isHarassmentElligible']})
    assert tenant.isHarassmentEligible is True


def test_get_user_by_phone_number_returns_none(mock_mongodb):
    mock_mongodb['identities'].find_one.return_value = None
    assert mongo.get_user_by_phone_number('blah') is None


def test_get_user_by_phone_number_returns_advocate(mock_mongodb):
    mock_mongodb['identities'].find_one.return_value = IDENTITY
    mock_mongodb['users'].find_one.return_value = {
        '_id': 'aewgaeg',
        'kind': 'Advocate',
        '_userdata': 'blah',
    }
    mock_mongodb['advocates'].find_one.return_value = ADVOCATE
    user = mongo.get_user_by_phone_number('blah')
    assert isinstance(user.advocate_info, mongo.MongoAdvocate)
    assert user.tenant_info is None
    assert isinstance(user.identity, mongo.MongoIdentity)


def test_get_user_by_phone_number_returns_tenant(mock_mongodb):
    mock_mongodb['identities'].find_one.return_value = IDENTITY
    mock_mongodb['users'].find_one.return_value = {
        '_id': 'aewgaeg',
        'kind': 'Tenant',
        '_userdata': 'blah',
    }
    mock_mongodb['tenants'].find_one.return_value = TENANT
    user = mongo.get_user_by_phone_number('blah')
    assert user.advocate_info is None
    assert isinstance(user.tenant_info, mongo.MongoTenant)
    assert isinstance(user.identity, mongo.MongoIdentity)
