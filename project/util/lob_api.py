import json
import logging
from typing import Dict, Any, BinaryIO, Optional
from threading import Lock
from django.conf import settings
import lob

logger = logging.getLogger(__name__)

MAX_NAME_LEN = 40

DELIVERABLE = "deliverable"

UNDELIVERABLE = "undeliverable"

# https://lob.com/docs#us_verifications_object
DELIVERABILITY_DOCS = {
    DELIVERABLE: "The address is deliverable by the USPS.",
    "deliverable_unnecessary_unit": (
        "The address is deliverable, but the secondary unit " "information is unnecessary."
    ),
    "deliverable_incorrect_unit": (
        "The address is deliverable to the building's default "
        "address but the secondary unit provided may not exist. "
        "There is a chance the mail will not reach the intended "
        "recipient."
    ),
    "deliverable_missing_unit": (
        "The address is deliverable to the building's default "
        "address but is missing secondary unit information. "
        "There is a chance the mail will not reach the intended "
        "recipient."
    ),
    UNDELIVERABLE: ("The address is not deliverable according to the USPS."),
}

# This is very odd. The Lob Python package doesn't have any way
# of having multiple threads access the Lob API using a different
# key, which we'd like to do because e.g. during development
# we might want to verify addresses using a production publishable
# key while sending mail using a test secret key. So we'll just
# use a lock to ensure thread safety when accessing the Lob API.
#
# This issue has been filed with Lob here:
# https://github.com/lob/lob-python/issues/163
_lock = Lock()


def _to_plain_object(obj):
    """
    Lob returns objects that are a subclass of dict, but
    we prefer regular dicts.
    """

    return json.loads(json.dumps(obj))


def truncate_name_in_address(address: Dict[str, Any]) -> Dict[str, Any]:
    """
    Lob limits the maximum length of a sender/recipient's name, but
    we don't necessarily limit our name lengths; if ours is longer than
    Lob's limit, just truncate it--we'll trust that the postal service
    can still make sense of the address.
    """

    if isinstance(address.get("name"), str):
        return {**address, "name": address["name"][:MAX_NAME_LEN]}
    return address


def _munge_tracking_number_when_fake(response: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    """
    If we're using a development Lob API key (one that starts with 'test_'),
    letters aren't actually mailed, but their tracking numbers returned by
    Lob still look real (at least to most people), which could confuse
    people using our demo site and such.  So we'll munge it so it definitely
    looks fake, e.g.:

        >>> _munge_tracking_number_when_fake({'tracking_number': '123'}, 'test_abc')
        {'tracking_number': 'FAKE_123'}

    However, if the API key is real, we won't munge it:

        >>> _munge_tracking_number_when_fake({'tracking_number': '123'}, 'live_abc')
        {'tracking_number': '123'}
    """

    if response.get("tracking_number") and api_key.startswith("test_"):
        response["tracking_number"] = "FAKE_" + response["tracking_number"]
    return response


def mail_certified_letter(
    description: str,
    to_address: Dict[str, Any],
    from_address: Dict[str, Any],
    file: BinaryIO,
    color: bool,
    double_sided: bool,
    request_return_receipt: bool = False,
) -> Dict[str, Any]:
    """
    Mail a certified letter via Lob:

        https://lob.com/docs#letters_create

    This returns a Lob letter object:

        https://lob.com/docs#letters_object
    """

    with _lock:
        lob.api_key = settings.LOB_SECRET_API_KEY
        if request_return_receipt:
            extra_service = "certified_return_receipt"
        else:
            extra_service = "certified"
        return _munge_tracking_number_when_fake(
            _to_plain_object(
                lob.Letter.create(
                    description=description,
                    to_address=truncate_name_in_address(to_address),
                    from_address=truncate_name_in_address(from_address),
                    file=file,
                    color=color,
                    double_sided=double_sided,
                    extra_service=extra_service,
                )
            ),
            api_key=lob.api_key,
        )


def verify_address(**params: str) -> Dict[str, Any]:
    """
    Verify an address via Lob:

        https://lob.com/docs#us_verifications_create

    This returns a Lob verification object:

        https://lob.com/docs#us_verifications_object
    """

    with _lock:
        lob.api_key = settings.LOB_PUBLISHABLE_API_KEY
        return _to_plain_object(lob.USVerification.create(**params))


def is_address_undeliverable(**params: str) -> Optional[bool]:
    """
    Given a Lob verification object, contacts Lob and returns whether
    the address appears to be undeliverable. Returns None if there
    was a problem contacting Lob, or if Lob integration is disabled.
    """

    if not settings.LOB_PUBLISHABLE_API_KEY:
        return None

    try:
        # One unfortunate aspect of Lob's Python library API is that
        # there isn't an easy way to provide a timeout to the request
        # it's making, so this can potentially hang. Hopefully this
        # will rarely/never be an issue.
        #
        # In the meantime, I've filed an issue about it with Lob
        # so hopefully it can be fixed eventually:
        #
        # https://github.com/lob/lob-python/issues/162
        v = verify_address(**params)
        return v["deliverability"] == UNDELIVERABLE
    except Exception as e:
        logger.exception(e)
        return None


def get_deliverability_docs(verification: Dict[str, Any]) -> str:
    """
    Return human-readable English documentation about
    the deliverability of the given Lob verification object.
    """

    return DELIVERABILITY_DOCS[verification["deliverability"]]


def verification_to_inline_address(verification: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert a Lob verification object to an inline address of
    the kind expected by Lob's letter creation endpoint:

        https://lob.com/docs#letters_create
    """

    v = verification
    vc = v["components"]
    return {
        "address_line1": v["primary_line"],
        "address_line2": v["secondary_line"],
        "address_city": vc["city"],
        "address_state": vc["state"],
        "address_zip": vc["zip_code"],
    }


def get_address_from_verification(verification: Dict[str, Any]) -> str:
    """
    Given a Lob verification object, return the human-readable
    address it represents.
    """

    v = verification
    return "\n".join(
        filter(None, [v["primary_line"], v["secondary_line"], v["urbanization"], v["last_line"]])
    )


def is_lob_fully_enabled() -> bool:
    """
    Returns whether Lob integration is fully enabled (can verify addresses
    and mail letters).
    """

    return bool(settings.LOB_SECRET_API_KEY and settings.LOB_PUBLISHABLE_API_KEY)
