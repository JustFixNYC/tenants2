from typing import Optional, Any, Tuple
from dataclasses import dataclass
import logging
import pydantic

from project import geocoding
from nycha.models import NychaOffice
import nycdb.models


logger = logging.getLogger(__name__)


class ValidatingLandlordInfo(pydantic.BaseModel):
    '''
    This class is used internally to validate the JSON response we
    receive from the server.
    '''

    # The name of the landlord/business owner, e.g. "BOBBY DENVER"
    ownername: Optional[str]

    # The business address, e.g. "123 DOOMBRINGER STREET 4 11299"
    businessaddr: Optional[str]


@dataclass
class LandlordInfo:
    '''
    Landlord details extracted from the server, or looked up
    via other means.
    '''

    name: str

    address: str


def _extract_landlord_info(json_blob: Any) -> Optional[LandlordInfo]:
    # https://github.com/JustFixNYC/who-owns-what/pull/40
    result = json_blob['result']
    if result:
        info = ValidatingLandlordInfo(**result[0])

        # I'm not 100% sure, but I *think* it might be possible for both the
        # owner name and business address to be None, so let's make sure
        # that at least one of them has content.
        if info.ownername or info.businessaddr:
            return LandlordInfo(name=info.ownername or '',
                                address=info.businessaddr or '')
    return None


def _lookup_bbl_and_full_address(address: str) -> Tuple[str, str]:
    features = geocoding.search(address)
    if not features:
        return ('', '')
    props = features[0].properties
    return (props.pad_bbl, props.label)


def _lookup_landlord_via_nycdb(pad_bbl: str) -> Optional[LandlordInfo]:
    contact = nycdb.models.get_landlord(pad_bbl)
    if contact:
        return LandlordInfo(
            name=contact.name,
            address='\n'.join(contact.address.lines_for_mailing)
        )
    return None


def _lookup_landlord_via_nycha(pad_bbl: str, address: str) -> Optional[LandlordInfo]:
    office = NychaOffice.objects.find_for_property(pad_bbl, address)
    if not office:
        return None
    return LandlordInfo(name=f"{office.name} MANAGEMENT", address=office.address)


def lookup_landlord(address: str) -> Optional[LandlordInfo]:
    '''
    Looks up information about the landlord at the given address
    and returns it, or None if no information could be gleaned.
    '''

    pad_bbl, full_addr = _lookup_bbl_and_full_address(address)
    if not pad_bbl:
        return None

    return (_lookup_landlord_via_nycha(pad_bbl, full_addr) or
            _lookup_landlord_via_nycdb(pad_bbl))
