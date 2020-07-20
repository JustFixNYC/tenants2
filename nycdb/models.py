import logging
from typing import Optional, NamedTuple, List, Union, TypeVar, Generic, Callable, Any
from django.db.utils import DatabaseError
from dataclasses import dataclass
from django.conf import settings
from django.db import models

from project.util.nyc import BBL, to_pad_bbl

logger = logging.getLogger(__name__)


class Address(NamedTuple):
    house_number: str
    street_name: str
    apartment: str
    city: str
    state: str
    zipcode: str

    @property
    def lines_for_mailing(self) -> List[str]:
        return [
            self.first_line,
            f"{self.city}, {self.state} {self.zipcode}"
        ]

    @property
    def first_line(self) -> str:
        first_line = f"{self.house_number} {self.street_name}"
        if self.apartment:
            first_line += f" #{self.apartment}"
        return first_line


@dataclass
class Individual:
    address: Address
    first_name: str
    last_name: str

    @property
    def name(self) -> str:
        return f"{self.first_name} {self.last_name}"


@dataclass
class Company:
    address: Address
    name: str


Contact = Union[Individual, Company]


class NYCDBManager(models.Manager):
    def get_queryset(self):
        db_alias = settings.NYCDB_DATABASE
        if not db_alias:
            raise Exception('NYCDB integration is disabled')
        return super().get_queryset().using(db_alias)


class HPDRegistrationManager(NYCDBManager):
    def from_pad_bbl(self, pad_bbl: str):
        bbl = BBL.parse(pad_bbl)
        return self.filter(boroid=bbl.boro, block=bbl.block, lot=bbl.lot)


# These models map onto the existing schema roughly defined here:
#
#     https://github.com/aepyornis/nyc-db/blob/master/src/nycdb/datasets.yml


class HPDRegistration(models.Model):
    class Meta:
        db_table = 'hpd_registrations'

    objects = HPDRegistrationManager()

    registrationid: int = models.IntegerField(primary_key=True)
    boroid: int = models.SmallIntegerField()
    block: int = models.SmallIntegerField()
    lot: int = models.SmallIntegerField()
    bin: int = models.IntegerField(default=0)

    @property
    def contact_list(self) -> List['HPDContact']:
        return list(self.contacts.all())

    @property
    def pad_bbl(self) -> str:
        return to_pad_bbl(self.boroid, self.block, self.lot)

    @property
    def pad_bin(self) -> str:
        return str(self.bin) if self.bin else ''

    def __str__(self) -> str:
        if self.pad_bin:
            extra = f"BIN {self.pad_bin} / BBL {self.pad_bbl}"
        else:
            extra = f"BBL {self.pad_bbl}"
        return f"HPD Registration #{self.registrationid} for {extra}"

    def _warn_if_multiple(self, items: List[Any], items_plural: str):
        if len(items) > 1:
            logger.warn(
                f"Found {len(items)} {items_plural} but expected one for {str(self)}.")

    def _get_company_landlord(self) -> Optional[Company]:
        owners = [
            c.corporationname for c in self.contact_list
            if c.type == HPDContact.CORPORATE_OWNER and c.corporationname
        ]
        if owners:
            head_officer_addresses = [
                (c.firstname, c.lastname, c.address) for c in self.contact_list
                if c.type == HPDContact.HEAD_OFFICER and c.address
            ]
            if head_officer_addresses:
                self._warn_if_multiple(head_officer_addresses, "head officers")
                first_name, last_name, address = head_officer_addresses[0]
                return Company(
                    name=f"{first_name} {last_name}",
                    address=address
                )
        return None

    def _get_indiv_landlord(self) -> Optional[Individual]:
        owners = [
            (c.firstname, c.lastname, c.address) for c in self.contact_list
            if c.type == HPDContact.INDIVIDUAL_OWNER and c.firstname and c.lastname and c.address
        ]
        if owners:
            self._warn_if_multiple(owners, "individual owners")
            first_name, last_name, address = owners[0]
            return Individual(
                first_name=first_name,
                last_name=last_name,
                address=address
            )
        return None

    def get_landlord(self) -> Optional[Contact]:
        return self._get_company_landlord() or self._get_indiv_landlord()

    def get_management_company(self) -> Optional[Company]:
        agents = [
            (c.corporationname, c.address) for c in self.contact_list
            if c.type == HPDContact.AGENT and c.address and c.corporationname
        ]
        if agents:
            self._warn_if_multiple(agents, "agents")
            name, address = agents[0]
            return Company(name=name, address=address)
        return None


class HPDContact(models.Model):
    class Meta:
        db_table = 'hpd_contacts'

    CORPORATE_OWNER = 'CorporateOwner'
    INDIVIDUAL_OWNER = 'IndividualOwner'
    HEAD_OFFICER = 'HeadOfficer'
    AGENT = 'Agent'

    objects = NYCDBManager()

    registrationcontactid: int = models.IntegerField(primary_key=True)
    registration: HPDRegistration = models.ForeignKey(
        HPDRegistration,
        db_column='registrationid',
        related_name='contacts',
        on_delete=models.CASCADE
    )
    type = models.TextField()
    contactdescription: Optional[str] = models.TextField(blank=True, null=True)
    corporationname: Optional[str] = models.TextField(blank=True, null=True)
    title: Optional[str] = models.TextField(blank=True, null=True)
    firstname: Optional[str] = models.TextField(blank=True, null=True)
    middleinitial: Optional[str] = models.TextField(blank=True, null=True)
    lastname: Optional[str] = models.TextField(blank=True, null=True)
    businesshousenumber: Optional[str] = models.TextField(blank=True, null=True)
    businessstreetname: Optional[str] = models.TextField(blank=True, null=True)
    businessapartment: Optional[str] = models.TextField(blank=True, null=True)
    businesscity: Optional[str] = models.TextField(blank=True, null=True)
    businessstate: Optional[str] = models.TextField(blank=True, null=True)
    businesszip: Optional[str] = models.TextField(blank=True, null=True)

    @property
    def street_address(self) -> str:
        return f"{self.businesshousenumber or ''} {self.businessstreetname or ''}".strip()

    @property
    def full_name(self) -> str:
        return f"{self.firstname or ''} {self.lastname or ''}".strip()

    @property
    def address(self) -> Optional[Address]:
        if not (self.businesshousenumber and
                self.businessstreetname and
                self.businesscity and
                self.businessstate and
                self.businesszip):
            return None
        return Address(
            house_number=self.businesshousenumber,
            street_name=self.businessstreetname,
            apartment=self.businessapartment or '',
            city=self.businesscity,
            state=self.businessstate,
            zipcode=self.businesszip
        )


T = TypeVar('T')


class NycdbGetter(Generic[T]):
    """
    Generic, fault-tolerant retriever of NYCDB information that assumes
    the NYCDB connection is unreliable, or disabled entirely.

    It's specialized for getting information based on a source BIN or BBL.
    At minimum, a BBL is required, but optionally a BIN may also be provided,
    and could be useful for retrieving the most accurate results.
    """

    def __init__(self, getter: Callable[[HPDRegistration], Optional[T]]) -> None:
        self.getter = getter

    def get_from_opt_hpd_registration(self, reg: Optional[HPDRegistration]) -> Optional[T]:
        if reg:
            return self.getter(reg)
        return None

    def __call__(self, pad_bbl: str, pad_bin: str = '') -> Optional[T]:
        if not settings.NYCDB_DATABASE:
            return None
        try:
            result: Optional[T] = None
            if pad_bin:
                result = self.get_from_opt_hpd_registration(
                    HPDRegistration.objects.filter(bin=int(pad_bin)).first())
            if result is None:
                result = self.get_from_opt_hpd_registration(
                    HPDRegistration.objects.from_pad_bbl(pad_bbl).first())
            return result
        except (DatabaseError, Exception):
            # TODO: Once we have more confidence in the underlying code,
            # we should remove the above 'Exception' and only catch
            # 'DatabaseError'.
            logger.exception(f'Error while retrieving data from NYCDB')
            return None


get_landlord = NycdbGetter[Contact](lambda reg: reg.get_landlord())

get_management_company = NycdbGetter[Company](lambda reg: reg.get_management_company())
