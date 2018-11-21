from typing import NamedTuple
from django.core.management.base import BaseCommand

from project import geocoding
from nycdb.models import HPDRegistration, HPDContact, Contact


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


class Command(BaseCommand):
    help = 'Obtain landlord information for the given address from NYCDB'

    def add_arguments(self, parser):
        parser.add_argument('address')

    def show_mailing_addr(self, contact: Contact, indent: str="    ") -> None:
        self.stdout.write(f"{indent}{contact.name}\n")
        for line in contact.address.lines_for_mailing:
            self.stdout.write(f"{indent}{line}\n")

    def show_raw_contact_info(self, contact: HPDContact) -> None:
        fields = ' / '.join(filter(None, [
            contact.type,
            contact.corporationname,
            contact.full_name,
            contact.street_address
        ]))
        self.stdout.write(f"  {fields}\n")

    def show_registration(self, reg: HPDRegistration) -> None:
        self.stdout.write(f"HPD Registration #{reg.registrationid}:\n")

        for contact in reg.contacts.all():
            self.show_raw_contact_info(contact)

        landlord = reg.get_landlord()
        if landlord:
            self.stdout.write(f"\n  Landlord ({landlord.__class__.__name__}):\n")
            self.show_mailing_addr(landlord)

        mgmt_co = reg.get_management_company()
        if mgmt_co:
            print(f"\n  Management company:")
            self.show_mailing_addr(mgmt_co)

    def show_registrations(self, pad_bbl: str) -> None:
        bbl = BBL.parse(pad_bbl)
        regs = HPDRegistration.objects.filter(boroid=bbl.boro, block=bbl.block, lot=bbl.lot)
        for reg in regs:
            self.show_registration(reg)

    def handle(self, *args, **options) -> None:
        address: str = options['address']

        features = geocoding.search(address)
        if features:
            props = features[0].properties
            self.stdout.write(props.label)
            self.show_registrations(props.pad_bbl)
        else:
            self.stdout.write("Address not found!\n")
