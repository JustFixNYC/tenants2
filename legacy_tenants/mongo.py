import pymongo
from django.conf import settings


def get_db():
    if not settings.LEGACY_MONGODB_URL:
        raise AssertionError('settings.LEGACY_MONGODB_URL must be defined')
    client = pymongo.MongoClient(settings.LEGACY_MONGODB_URL)
    return client.get_default_database()
