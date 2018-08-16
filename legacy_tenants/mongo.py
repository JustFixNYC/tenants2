import pymongo
from django.conf import settings


_db = None


def get_db():
    global _db

    if _db is None:
        if not settings.LEGACY_MONGODB_URL:
            raise AssertionError('settings.LEGACY_MONGODB_URL must be defined')
        client = pymongo.MongoClient(settings.LEGACY_MONGODB_URL)
        _db = client.get_default_database()

    return _db
