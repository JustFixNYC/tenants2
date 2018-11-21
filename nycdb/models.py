from typing import Optional, NamedTuple, List
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
class Landlord:
    address: Address

    def get_address_lines_for_mailing(self) -> List[str]:
        return self.address.get_lines_for_mailing()


@dataclass
class IndividualLandlord(Landlord):
    first_name: str
    last_name: str

    def get_address_lines_for_mailing(self) -> List[str]:
        return [
            f"{self.first_name} {self.last_name}",
            *super().get_address_lines_for_mailing()
        ]


@dataclass
class CompanyLandlord(Landlord):
    name: str

    def get_address_lines_for_mailing(self) -> List[str]:
        return [
            self.name,
            *super().get_address_lines_for_mailing()
        ]


class HPDRegistration(models.Model):
    class Meta:
        db_table = 'hpd_registrations'

    registrationid = models.IntegerField(primary_key=True)
    boroid = models.SmallIntegerField()
    block = models.SmallIntegerField()
    lot = models.SmallIntegerField()

    def _get_company_landlord(self, contacts: List['HPDContact']) -> Optional[CompanyLandlord]:
        corp_owners = [c for c in contacts if c.type == HPDContact.CORPORATE_OWNER]
        if corp_owners:
            corp_owner = corp_owners[0]
            head_officers = [c for c in contacts if c.type == HPDContact.HEAD_OFFICER]
            head_officer = None
            if head_officers:
                head_officer = head_officers[0]
                return CompanyLandlord(
                    name=corp_owner.corporationname or '',
                    address=head_officer.get_address()
                )
        return None

    def _get_indiv_landlord(self, contacts: List['HPDContact']) -> Optional[IndividualLandlord]:
        ind_owners = [c for c in contacts if c.type == HPDContact.INDIVIDUAL_OWNER]
        if ind_owners:
            ind_owner = ind_owners[0]
            return IndividualLandlord(
                first_name=ind_owner.firstname or '',
                last_name=ind_owner.lastname or '',
                address=ind_owner.get_address()
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

    def get_address(self) -> Address:
        return Address(
            house_number=self.businesshousenumber or '',
            street_name=self.businessstreetname or '',
            apartment=self.businessapartment or '',
            city=self.businesscity or '',
            state=self.businessstate or '',
            zipcode=self.businesszip or ''
        )
