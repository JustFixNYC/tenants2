from typing import Optional, NamedTuple, List, Union
from dataclasses import dataclass

from django.db import models

# These models map onto the existing schema roughly defined here:
#
#     https://github.com/aepyornis/nyc-db/blob/master/src/nycdb/datasets.yml


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
        return super().get_queryset().using('nycdb')


class HPDRegistration(models.Model):
    class Meta:
        db_table = 'hpd_registrations'

    objects = NYCDBManager()

    registrationid = models.IntegerField(primary_key=True)
    boroid = models.SmallIntegerField()
    block = models.SmallIntegerField()
    lot = models.SmallIntegerField()

    @property
    def contact_list(self) -> List['HPDContact']:
        return list(self.contacts.all())

    def _get_company_landlord(self) -> Optional[Company]:
        owners = [
            c for c in self.contact_list
            if c.type == HPDContact.CORPORATE_OWNER and c.corporationname
        ]
        if owners:
            head_officer_addresses = [
                c.address for c in self.contact_list
                if c.type == HPDContact.HEAD_OFFICER and c.address
            ]
            if head_officer_addresses:
                return Company(
                    name=owners[0].corporationname,
                    address=head_officer_addresses[0]
                )
        return None

    def _get_indiv_landlord(self) -> Optional[Individual]:
        owners = [
            (c, c.address) for c in self.contact_list
            if c.type == HPDContact.INDIVIDUAL_OWNER and c.firstname and c.lastname and c.address
        ]
        if owners:
            owner, address = owners[0]
            return Individual(
                first_name=owner.firstname,
                last_name=owner.lastname,
                address=address
            )
        return None

    def get_landlord(self) -> Optional[Contact]:
        return self._get_company_landlord() or self._get_indiv_landlord()

    def get_management_company(self) -> Optional[Company]:
        agents = [
            (c, c.address) for c in self.contact_list
            if c.type == HPDContact.AGENT and c.address and c.corporationname
        ]
        if agents:
            agent, address = agents[0]
            return Company(name=agent.corporationname, address=address)
        return None


class HPDContact(models.Model):
    class Meta:
        db_table = 'hpd_contacts'

    CORPORATE_OWNER = 'CorporateOwner'
    INDIVIDUAL_OWNER = 'IndividualOwner'
    HEAD_OFFICER = 'HeadOfficer'
    AGENT = 'Agent'

    objects = NYCDBManager()

    registrationcontactid = models.IntegerField(primary_key=True)
    registrationid = models.ForeignKey(
        HPDRegistration,
        db_column='registrationid',
        related_name='contacts',
        on_delete=models.CASCADE
    )
    type = models.TextField()
    contactdescription = models.TextField()
    corporationname = models.TextField()
    title = models.TextField()
    firstname = models.TextField()
    middleinitial = models.TextField()
    lastname = models.TextField()
    businesshousenumber = models.TextField()
    businessstreetname = models.TextField()
    businessapartment = models.TextField()
    businesscity = models.TextField()
    businessstate = models.TextField()
    businesszip = models.TextField()

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
