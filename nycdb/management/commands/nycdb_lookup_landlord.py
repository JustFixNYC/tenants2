import json
from typing import List, Any
from django.core.management.base import BaseCommand
from django.core import serializers

from project import geocoding
from nycdb.models import HPDRegistration, HPDContact, Contact


class Command(BaseCommand):
    help = 'Obtain landlord information for the given address from NYCDB'

    def add_arguments(self, parser):
        parser.add_argument('address')
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

    def handle(self, *args, **options) -> None:
        address: str = options['address']
        dump_models: bool = options['dump_models']

        features = geocoding.search(address)
        if features:
            props = features[0].properties
            if dump_models:
                self.dump_models(props.pad_bbl)
            else:
                self.stdout.write(props.label)
                self.show_registrations(props.pad_bbl)
        else:
            self.stderr.write("Address not found!\n")
