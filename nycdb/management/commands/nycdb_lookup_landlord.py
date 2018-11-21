import json
from typing import List, Any
from django.core.management.base import BaseCommand, CommandError
from django.core import serializers

from project import geocoding
from project.util.nyc import BBL
from nycdb.models import HPDRegistration, HPDContact, Contact


class Command(BaseCommand):
    help = 'Obtain landlord information for the given address from NYCDB'

    def add_arguments(self, parser):
        parser.add_argument(
            'address-or-bbl',
            help=("The street address (e.g. '123 Boop St, Brooklyn') "
                  "or padded BBL (e.g. '2022150116') to look up.")
        )
        parser.add_argument(
            '--dump-models',
            action='store_true',
            help='Dump related models to stdout as JSON.'
        )

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
        regs = HPDRegistration.objects.from_pad_bbl(pad_bbl)
        for reg in regs:
            self.show_registration(reg)

    def dump_models(self, pad_bbl: str) -> None:
        regs = HPDRegistration.objects.from_pad_bbl(pad_bbl)
        models: List[Any] = list(regs)
        for reg in regs:
            models.extend(reg.contact_list)
        data = json.loads(serializers.serialize('json', models))
        self.stdout.write(json.dumps(data, indent=2))

    def parse_address_or_bbl(self, value: str) -> str:
        if BBL.safe_parse(value):
            return value
        features = geocoding.search(value)
        if not features:
            raise CommandError("Address not found!")

        props = features[0].properties
        self.stdout.write(f"Found BBL {props.pad_bbl} ({props.label}).")
        return props.pad_bbl

    def handle(self, *args, **options) -> None:
        address_or_bbl: str = options['address-or-bbl']
        dump_models: bool = options['dump_models']

        pad_bbl = self.parse_address_or_bbl(address_or_bbl)

        if dump_models:
            self.dump_models(pad_bbl)
        else:
            self.show_registrations(pad_bbl)
