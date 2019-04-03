import json
from typing import Dict, Any, BinaryIO
from threading import Lock
from django.conf import settings
import lob

DELIVERABLE = 'deliverable'

UNDELIVERABLE = 'undeliverable'

# https://lob.com/docs#us_verifications_object
DELIVERABILITY_DOCS = {
    DELIVERABLE: 'The address is deliverable by the USPS.',
    'deliverable_unnecessary_unit': (
        'The address is deliverable, but the secondary unit '
        'information is unnecessary.'
    ),
    'deliverable_incorrect_unit': (
        "The address is deliverable to the building's default "
        "address but the secondary unit provided may not exist. "
        "There is a chance the mail will not reach the intended "
        "recipient."
    ),
    'deliverable_missing_unit': (
        "The address is deliverable to the building's default "
        "address but is missing secondary unit information. "
        "There is a chance the mail will not reach the intended "
        "recipient."
    ),
    UNDELIVERABLE: (
        "The address is not deliverable according to the USPS."
    )
}

# This is very odd. The Lob Python package doesn't have any way
# of having multiple threads access the Lob API using a different
# key, which we'd like to do because e.g. during development
# we might want to verify addresses using a production publishable
# key while sending mail using a test secret key. So we'll just
# use a lock to ensure thread safety when accessing the Lob API.
_lock = Lock()


def _to_plain_object(obj):
    '''
    Lob returns objects that are a subclass of dict, but
    we prefer regular dicts.
    '''

    return json.loads(json.dumps(obj))


def mail_certified_letter(
    description: str,
    to_address: Dict[str, Any],
    from_address: Dict[str, Any],
    file: BinaryIO,
    color: bool
) -> Dict[str, Any]:
    '''
    Mail a certified letter via Lob:

        https://lob.com/docs#letters_create

    This returns a Lob letter object:

        https://lob.com/docs#letters_object
    '''

    with _lock:
        lob.api_key = settings.LOB_SECRET_API_KEY
        return _to_plain_object(lob.Letter.create(
            description=description,
            to_address=to_address,
            from_address=from_address,
            file=file,
            color=color,
            extra_service='certified',
        ))


def verify_address(**params: str) -> Dict[str, Any]:
    '''
    Verify an address via Lob:

        https://lob.com/docs#us_verifications_create

    This returns a Lob verification object:

        https://lob.com/docs#us_verifications_object
    '''

    with _lock:
        lob.api_key = settings.LOB_PUBLISHABLE_API_KEY
        return _to_plain_object(lob.USVerification.create(**params))


def get_deliverability_docs(verification: Dict[str, Any]) -> str:
    '''
    Return human-readable English documentation about
    the deliverability of the given Lob verification object.
    '''

    return DELIVERABILITY_DOCS[verification['deliverability']]


def verification_to_inline_address(verification: Dict[str, Any]) -> Dict[str, Any]:
    '''
    Convert a Lob verification object to an inline address of
    the kind expected by Lob's letter creation endpoint:

        https://lob.com/docs#letters_create
    '''

    v = verification
    vc = v['components']
    return {
        'address_line1': v['primary_line'],
        'address_line2': v['secondary_line'],
        'address_city': vc['city'],
        'address_state': vc['state'],
        'address_zip': vc['zip_code']
    }


def get_address_from_verification(verification: Dict[str, Any]) -> str:
    '''
    Given a Lob verification object, return the human-readable
    address it represnts.
    '''

    v = verification
    return '\n'.join(filter(None, [
        v['primary_line'],
        v['secondary_line'],
        v['urbanization'],
        v['last_line']
    ]))
