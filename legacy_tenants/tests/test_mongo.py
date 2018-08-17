from .. import mongo
from . import factories
from .example_legacy_data import TENANT, ADVOCATE, IDENTITY, USER


def test_is_rent_stabilized_works():
    tenant = factories.MongoTenantFactory(actionFlags=[])
    assert tenant.isRentStabilized is False

    tenant = factories.MongoTenantFactory(actionFlags=['isRentStabilized'])
    assert tenant.isRentStabilized is True


def test_is_harassment_eligible_works():
    tenant = factories.MongoTenantFactory(actionFlags=[])
    assert tenant.isHarassmentEligible is False

    tenant = factories.MongoTenantFactory(actionFlags=['isHarassmentElligible'])
    assert tenant.isHarassmentEligible is True


def test_get_advocate_tenants_works(mock_mongodb):
    mock_mongodb['tenants'].find.return_value = [TENANT]
    tenants = list(mongo.get_advocate_tenants(factories.MongoAdvocateFactory()))
    assert len(tenants) == 1
    assert isinstance(tenants[0], mongo.MongoTenant)


def test_get_user_by_phone_number_returns_none(mock_mongodb):
    mock_mongodb['identities'].find_one.return_value = None
    assert mongo.get_user_by_phone_number('blah') is None


def test_get_user_by_phone_number_returns_advocate(mock_mongodb):
    mock_mongodb['identities'].find_one.return_value = IDENTITY
    mock_mongodb['users'].find_one.return_value = {**USER, 'kind': 'Advocate'}
    mock_mongodb['advocates'].find_one.return_value = ADVOCATE
    user = mongo.get_user_by_phone_number('blah')
    assert isinstance(user.advocate_info, mongo.MongoAdvocate)
    assert user.tenant_info is None
    assert isinstance(user.identity, mongo.MongoIdentity)


def test_get_user_by_phone_number_returns_tenant(mock_mongodb):
    mock_mongodb['identities'].find_one.return_value = IDENTITY
    mock_mongodb['users'].find_one.return_value = {**USER, 'kind': 'Tenant'}
    mock_mongodb['tenants'].find_one.return_value = TENANT
    user = mongo.get_user_by_phone_number('blah')
    assert user.advocate_info is None
    assert isinstance(user.tenant_info, mongo.MongoTenant)
    assert isinstance(user.identity, mongo.MongoIdentity)
