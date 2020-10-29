import json
from typing import List, Any
from django.core.management.base import BaseCommand, CommandError
from django.core import serializers

from project import geocoding
from project.util.nyc import BBL, is_bin
from nycdb.models import HPDRegistration, HPDContact, Contact, filter_and_sort_registrations


class Command(BaseCommand):
    help = 'Obtain landlord information for the given address from NYCDB'

    def add_arguments(self, parser):
        parser.add_argument(
            'address-or-bbl-or-bin',
            help=("The street address (e.g. '123 Boop St, Brooklyn') "
                  "or padded BBL (e.g. '2022150116') or BIN (e.g. '1234567') to look up.")
        )
        parser.add_argument(
            '--no-head-officer',
            action='store_true',
            help='Ensure the landlord is not a head officer.',
        )
        parser.add_argument(
            '--dump-models',
            action='store_true',
            help='Dump related models to stdout as JSON.'
        )

    def show_mailing_addr(self, contact: Contact, indent: str = "    ") -> None:
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

    def show_registration(self, reg: HPDRegistration, prefer_head_officer: bool) -> None:
        self.stdout.write(
            f"HPD Registration #{reg.registrationid} "
            f"({reg.lastregistrationdate} thru {reg.registrationenddate}):\n"
        )

        for contact in reg.contacts.all():
            self.show_raw_contact_info(contact)

        landlord = reg.get_landlord(prefer_head_officer)
        if landlord:
            self.stdout.write(f"\n  Landlord ({landlord.__class__.__name__}):\n")
            self.show_mailing_addr(landlord)

        mgmt_co = reg.get_management_company()
        if mgmt_co:
            print(f"\n  Management company:")
            self.show_mailing_addr(mgmt_co)

    def _get_registrations(self, pad_bbl_or_bin: str):
        if is_bin(pad_bbl_or_bin):
            qs = HPDRegistration.objects.filter(bin=int(pad_bbl_or_bin))
        else:
            qs = HPDRegistration.objects.from_pad_bbl(pad_bbl_or_bin)
        return filter_and_sort_registrations(qs)

    def show_registrations(self, pad_bbl_or_bin: str, prefer_head_officer: bool) -> None:
        for reg in self._get_registrations(pad_bbl_or_bin):
            self.show_registration(reg, prefer_head_officer)
            print()

    def dump_models(self, pad_bbl_or_bin: str) -> None:
        regs = self._get_registrations(pad_bbl_or_bin)
        models: List[Any] = list(regs)
        for reg in regs:
            models.extend(reg.contact_list)
        data = json.loads(serializers.serialize('json', models))
        self.stdout.write(json.dumps(data, indent=2))

    def parse_address_or_bbl_or_bin(self, value: str) -> str:
        if BBL.safe_parse(value) or is_bin(value):
            return value
        features = geocoding.search(value)
        if not features:
            raise CommandError("Address not found!")

        props = features[0].properties
        self.stdout.write(f"Found BBL {props.pad_bbl} / BIN {props.pad_bin} ({props.label}).")
        self.stdout.write(
            f"Using the BIN (call this command separately with the BBL to use that instead).")
        return props.pad_bin

    def handle(self, *args, **options) -> None:
        address_or_bbl_or_bin: str = options['address-or-bbl-or-bin']
        no_head_officer: bool = options['no_head_officer']
        dump_models: bool = options['dump_models']

        pad_bbl_or_bin = self.parse_address_or_bbl_or_bin(address_or_bbl_or_bin)

        if dump_models:
            self.dump_models(pad_bbl_or_bin)
        else:
            self.show_registrations(pad_bbl_or_bin, not no_head_officer)
