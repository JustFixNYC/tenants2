import json
from typing import Dict, Any, BinaryIO
from threading import Lock
from django.conf import settings
import lob


# This is very odd. The Lob Python package doesn't have any way
# of having multiple threads access the Lob API using a different
# key, which we'd like to do because e.g. during development
# we might want to verify addresses using a production publishable
# key while sending mail using a test secret key. So we'll just
# use a lock to ensure thread safety when accessing the Lob API.
_lock = Lock()


def _to_plain_object(obj):
    return json.loads(json.dumps(obj))


def mail_certified_letter(
    description: str,
    to_address: Dict[str, Any],
    from_address: Dict[str, Any],
    file: BinaryIO,
    color: bool
) -> Dict[str, Any]:
    with _lock:
        lob.api_key = settings.LOB_SECRET_API_KEY
        return _to_plain_object(lob.Letter.create(
            description='Letter of complaint',
            to_address=to_address,
            from_address=from_address,
            file=file,
            color=color,
            extra_service='certified',
        ))


def verify_address(**params: str) -> Dict[str, Any]:
    with _lock:
        lob.api_key = settings.LOB_PUBLISHABLE_API_KEY
        return _to_plain_object(lob.USVerification.create(**params))
