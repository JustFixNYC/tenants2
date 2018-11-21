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

    def get_lines_for_mailing(self) -> List[str]:
        first_line = f"{self.house_number} {self.street_name}"
        if self.apartment:
            first_line += f" #{self.apartment}"
        return [
            first_line,
            f"{self.city}, {self.state} {self.zipcode}"
        ]


@dataclass
class BaseLandlord:
    address: Address

    def get_address_lines_for_mailing(self) -> List[str]:
        return self.address.get_lines_for_mailing()


@dataclass
class IndividualLandlord(BaseLandlord):
    first_name: str
    last_name: str

    def get_address_lines_for_mailing(self) -> List[str]:
        return [
            f"{self.first_name} {self.last_name}",
            *super().get_address_lines_for_mailing()
        ]


@dataclass
class CompanyLandlord(BaseLandlord):
    name: str

    def get_address_lines_for_mailing(self) -> List[str]:
        return [
            self.name,
            *super().get_address_lines_for_mailing()
        ]


Landlord = Union[CompanyLandlord, IndividualLandlord]


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

    def _get_company_landlord(self, contacts: List['HPDContact']) -> Optional[CompanyLandlord]:
        corp_owners = [c for c in contacts if c.type == HPDContact.CORPORATE_OWNER]
        if corp_owners:
            corp_owner = corp_owners[0]
            head_officers = [c for c in contacts if c.type == HPDContact.HEAD_OFFICER]
            name = corp_owner.corporationname
            if name and head_officers:
                address = head_officers[0].get_address()
                if address:
                    return CompanyLandlord(name=name, address=address)
        return None

    def _get_indiv_landlord(self, contacts: List['HPDContact']) -> Optional[IndividualLandlord]:
        ind_owners = [c for c in contacts if c.type == HPDContact.INDIVIDUAL_OWNER]
        if ind_owners:
            ind_owner = ind_owners[0]
            first_name = ind_owner.firstname
            last_name = ind_owner.lastname
            address = ind_owner.get_address()
            if first_name and last_name and address:
                return IndividualLandlord(
                    first_name=first_name,
                    last_name=last_name,
                    address=address
                )
        return None

    def get_landlord(self) -> Optional[Landlord]:
        contacts = list(self.contacts.all())
        return self._get_company_landlord(contacts) or self._get_indiv_landlord(contacts)


class HPDContact(models.Model):
    class Meta:
        db_table = 'hpd_contacts'

    CORPORATE_OWNER = 'CorporateOwner'
    INDIVIDUAL_OWNER = 'IndividualOwner'
    HEAD_OFFICER = 'HeadOfficer'

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

    def get_address(self) -> Optional[Address]:
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
