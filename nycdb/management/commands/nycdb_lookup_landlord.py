from typing import NamedTuple
from django.core.management.base import BaseCommand

from project import geocoding
from nycdb.models import HPDRegistration


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

    def handle(self, *args, **options) -> None:
        address: str = options['address']

        features = geocoding.search(address)
        if not features:
            print("Address not found!")
            return
        pad_bbl = features[0].properties.pad_bbl
        bbl = BBL.parse(pad_bbl)

        regs = HPDRegistration.objects.filter(boroid=bbl.boro, block=bbl.block, lot=bbl.lot)
        regs_count: int = regs.count()
        print(f"HPD registrations: {regs_count}")
        if regs_count == 0:
            return

        reg: HPDRegistration
        for reg in regs:
            print(f"Registration #{reg.registrationid}:")
            for contact in reg.contacts.all():
                fields = ' '.join(filter(None, [
                    contact.type, contact.contactdescription, contact.corporationname,
                    contact.title, contact.firstname, contact.lastname,
                    contact.businesshousenumber, contact.businessstreetname,
                    contact.businessapartment, contact.businesscity
                ]))
                print(f"  {fields}")
            landlord = reg.get_landlord()
            if landlord:
                print(f"\n  Landlord ({landlord.__class__.__name__}):")
                print(f"    {landlord.name}")
                for line in landlord.address.lines_for_mailing:
                    print(f"    {line}")
            mgmt_co = reg.get_management_company()
            if mgmt_co:
                print(f"\n  Management company:")
                print(f"    {mgmt_co.name}")
                for line in mgmt_co.address.lines_for_mailing:
                    print(f"    {line}")
