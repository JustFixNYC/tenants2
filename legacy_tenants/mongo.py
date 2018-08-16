import datetime
from typing import List, Optional
import pymongo
from django.conf import settings
import pydantic


_db = None


class MongoIdentity(pydantic.BaseModel):
    '''
    Corresponds to the Identity model of the legacy app.
    '''

    salt: str
    provider: str
    roles: List[str]
    password: str
    phone: str


class MongoAdvocate(pydantic.BaseModel):
    '''
    Corresponds to the Advocate model of the legacy app.
    '''

    code: str


class MongoTenantSharingInfo(pydantic.BaseModel):
    '''
    Information about a tenant's profile sharing.
    '''

    key: str
    enabled: bool


class MongoTenant(pydantic.BaseModel):
    '''
    Corresponds to the Tenant model of the legacy app.
    '''

    updated: datetime.datetime
    sharing: MongoTenantSharingInfo
    fullName: str
    phone: str
    address: str
    borough: str


class MongoUser(pydantic.BaseModel):
    '''
    Corresponds to the User model of the legacy app.
    While it's semantically the same, the field names
    and structure have been changed.
    '''

    identity: MongoIdentity

    # If the user isn't an advocate, this will be None.
    advocate_info: Optional[MongoAdvocate]

    tenant_info: Optional[MongoTenant]


def get_user_by_phone_number(phone: str) -> Optional[MongoUser]:
    '''
    Attempt to find the given user identified by their phone
    number. Returns None if the user doesn't exist.
    '''

    # I'm sure there's some way to do a join in mongoDB
    # and get all this information with a single query, but
    # I don't know what it is, and efficiency isn't terribly
    # important here, so we'll just use multiple queries for now.

    db = get_db()
    ident = db['identities'].find_one({'phone': phone})
    if ident is None:
        return None

    user = db['users'].find_one({'_identity': ident['_id']})
    advocate = None
    tenant = None
    if user['kind'] == 'Advocate':
        advocate = db['advocates'].find_one({'_id': user['_userdata']})
    elif user['kind'] == 'Tenant':
        tenant = db['tenants'].find_one({'_id': user['_userdata']})

    return MongoUser(**{
        'identity': ident,
        'advocate_info': advocate,
        'tenant_info': tenant
    })


def get_db():
    '''
    Retrieve a database connection to the MongoDB instance of
    the legacy tenants app.
    '''

    global _db

    if _db is None:
        if not settings.LEGACY_MONGODB_URL:
            raise AssertionError('settings.LEGACY_MONGODB_URL must be defined')
        client = pymongo.MongoClient(settings.LEGACY_MONGODB_URL)
        _db = client.get_default_database()

    return _db
