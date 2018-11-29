import logging
from typing import Optional, NamedTuple, List, Union
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
        first_line = f"{self.house_number} {self.street_name}"
        if self.apartment:
            first_line += f" #{self.apartment}"
        return [
            first_line,
            f"{self.city}, {self.state} {self.zipcode}"
        ]


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

    @property
    def contact_list(self) -> List['HPDContact']:
        return list(self.contacts.all())

    @property
    def pad_bbl(self) -> str:
        return to_pad_bbl(self.boroid, self.block, self.lot)

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


def get_landlord(pad_bbl: str) -> Optional[Contact]:
    """
    Fault-tolerant retriever of landlord information that assumes
    the NYCDB connection is unreliable, or disabled entirely.
    """

    if not settings.NYCDB_DATABASE:
        return None
    try:
        reg = HPDRegistration.objects.from_pad_bbl(pad_bbl).first()
        return reg.get_landlord() if reg else None
    except (DatabaseError, Exception):
        # TODO: Once we have more confidence in the underlying code,
        # we should remove the above 'Exception' and only catch
        # 'DatabaseError'.
        logger.exception(f'Error while retrieving data from NYCDB')
        return None


def get_management_company(pad_bbl: str) -> Optional[Company]:
    """
    Fault-tolerant retriever of management company information that assumes
    the NYCDB connection is unreliable, or disabled entirely.
    """

    # Yes, this contains a ton of duplicate logic from get_landlord().
    # Ideally we'd use a decorator but apparently mypy has major
    # problems with it.

    if not settings.NYCDB_DATABASE:
        return None
    try:
        reg = HPDRegistration.objects.from_pad_bbl(pad_bbl).first()
        return reg.get_management_company() if reg else None
    except (DatabaseError, Exception):
        # TODO: Once we have more confidence in the underlying code,
        # we should remove the above 'Exception' and only catch
        # 'DatabaseError'.
        logger.exception(f'Error while retrieving data from NYCDB')
        return None
