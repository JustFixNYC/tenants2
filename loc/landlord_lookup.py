from typing import Optional, Tuple
from dataclasses import dataclass
import logging

from project import geocoding
from nycha.models import NychaOffice
import nycdb.models


logger = logging.getLogger(__name__)


@dataclass
class LandlordInfo:
    """
    Landlord details extracted from the server, or looked up
    via other means.
    """

    name: str

    # This is the full mailing address.
    address: str

    # These are individual parts of the full mailing address.
    primary_line: str
    city: str
    state: str
    zip_code: str


def _lookup_bbl_and_bin_and_full_address(address: str) -> Tuple[str, str, str]:
    features = geocoding.search(address)
    if not features:
        return ("", "", "")
    props = features[0].properties
    return (props.pad_bbl, props.pad_bin, props.label)


def _lookup_landlord_via_nycdb(pad_bbl: str, pad_bin: str) -> Optional[LandlordInfo]:
    contact = nycdb.models.get_landlord(pad_bbl, pad_bin)
    if contact:
        return LandlordInfo(
            name=contact.name,
            address="\n".join(contact.address.lines_for_mailing),
            primary_line=contact.address.first_line,
            city=contact.address.city,
            state=contact.address.state,
            zip_code=contact.address.zipcode,
        )
    return None


def _lookup_landlord_via_nycha(pad_bbl: str, address: str) -> Optional[LandlordInfo]:
    office = NychaOffice.objects.find_for_property(pad_bbl, address)
    if not office:
        return None
    return LandlordInfo(
        name=f"{office.name} MANAGEMENT",
        address=office.address,
        primary_line=office.primary_line,
        city=office.city,
        state=office.state,
        zip_code=office.zip_code,
    )


def lookup_landlord(address: str, pad_bbl: str = "", pad_bin: str = "") -> Optional[LandlordInfo]:
    """
    Looks up information about the landlord at the given address
    and returns it, or None if no information could be gleaned.
    """

    if pad_bbl:
        full_addr = address
    else:
        pad_bbl, pad_bin, full_addr = _lookup_bbl_and_bin_and_full_address(address)
        if not pad_bbl:
            return None

    return _lookup_landlord_via_nycha(pad_bbl, full_addr) or _lookup_landlord_via_nycdb(
        pad_bbl, pad_bin
    )
