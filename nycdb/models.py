from typing import Optional, NamedTuple, List, Union
from dataclasses import dataclass

from django.conf import settings
from django.db import models

# These models map onto the existing schema roughly defined here:
#
#     https://github.com/aepyornis/nyc-db/blob/master/src/nycdb/datasets.yml


class BBL(NamedTuple):
    '''
    Encapsulates the Boro, Block, and Lot number for a unit of real estate in NYC:

        https://en.wikipedia.org/wiki/Borough,_Block_and_Lot

    BBLs can be parsed from their padded string representations:

        >>> BBL.parse('2022150116')
        BBL(boro=2, block=2215, lot=116)
    '''

    boro: int
    block: int
    lot: int

    @staticmethod
    def parse(pad_bbl: str) -> 'BBL':
        boro = int(pad_bbl[0:1])
        block = int(pad_bbl[1:6])
        lot = int(pad_bbl[6:])
        return BBL(boro, block, lot)


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
class BaseContact:
    address: Address


@dataclass
class Individual(BaseContact):
    first_name: str
    last_name: str

    @property
    def name(self) -> str:
        return f"{self.first_name} {self.last_name}"


@dataclass
class Company(BaseContact):
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


class HPDRegistration(models.Model):
    class Meta:
        db_table = 'hpd_registrations'

    objects = HPDRegistrationManager()

    registrationid = models.IntegerField(primary_key=True)
    boroid = models.SmallIntegerField()
    block = models.SmallIntegerField()
    lot = models.SmallIntegerField()

    @property
    def contact_list(self) -> List['HPDContact']:
        return list(self.contacts.all())

    def _get_company_landlord(self) -> Optional[Company]:
        owners = [
            c.corporationname for c in self.contact_list
            if c.type == HPDContact.CORPORATE_OWNER and c.corporationname
        ]
        if owners:
            head_officer_addresses = [
                c.address for c in self.contact_list
                if c.type == HPDContact.HEAD_OFFICER and c.address
            ]
            if head_officer_addresses:
                return Company(
                    name=owners[0],
                    address=head_officer_addresses[0]
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
