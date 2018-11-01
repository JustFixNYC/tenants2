import csv
from pathlib import Path
from dataclasses import dataclass
from typing import Dict, Set, TextIO, Iterator, Tuple
from django.core.management.base import BaseCommand
from django.db import transaction
import pydantic

from nycha.models import NychaOffice, NychaProperty


MANHATTAN = 'MANHATTAN'

# https://en.wikipedia.org/wiki/Borough,_Block_and_Lot
BOROUGH_NUMBERS = {
    MANHATTAN: 1,
    'BRONX': 2,
    'BROOKLYN': 3,
    'QUEENS': 4,
    'STATEN ISLAND': 5
}

BLOCK_DIGITS = 5

LOT_DIGITS = 4


class Row(pydantic.BaseModel):
    BOROUGH: str
    BLOCK: str
    LOT: str
    ADDRESS: str
    ZIP_CODE: str = pydantic.Schema(..., alias="ZIP CODE")
    MANAGED_BY: str = pydantic.Schema(..., alias="MANAGED BY")
    FACILITY: str

    @property
    def pad_bbl(self) -> str:
        borough_num = BOROUGH_NUMBERS[self.BOROUGH]
        return (
            f'{borough_num}'
            f'{self.BLOCK.zfill(BLOCK_DIGITS)}'
            f'{self.LOT.zfill(LOT_DIGITS)}'
        )

    @property
    def full_address(self) -> str:
        city = self.BOROUGH
        if city == MANHATTAN:
            city = 'NEW YORK'
        return f'{self.ADDRESS}\n{city}, NY {self.ZIP_CODE}'

    def is_main_management_office(self) -> bool:
        return ('DEVELOPMENT MANAGEMENT OFFICE' in self.FACILITY and
                'SATELLITE' not in self.FACILITY)


@dataclass
class ManagementOffice:
    row: Row
    pad_bbl_and_addresses: Set[Tuple[str, str]]


class NychaCsvLoader:
    offices: Dict[str, ManagementOffice]
    mgmt_orgs: Set[str]
    pad_bbls: Dict[str, ManagementOffice]
    bbls_with_many_offices: Set[str]
    stdout: TextIO
    stderr: TextIO

    def __init__(self, stdout: TextIO, stderr: TextIO) -> None:
        self.offices = {}
        self.mgmt_orgs = set()
        self.bbls_with_many_offices = set()
        self.pad_bbls = {}
        self.stderr = stderr
        self.stdout = stdout

    def iter_rows(self, csvpath: Path) -> Iterator[Row]:
        with csvpath.open('r') as csvfile:
            reader = csv.DictReader(csvfile)
            for dictrow in reader:
                row = Row(**dictrow)
                yield row

    def load_csv(self, csvpath: Path) -> None:
        mgmt_rows = (row for row in self.iter_rows(csvpath)
                     if row.is_main_management_office())
        # Iterate through the rows once to load all the management
        # offices.
        for row in mgmt_rows:
            self.load_management_office_row(row)
        # Iterate through the rows again to associate every property
        # with a management office.
        for row in self.iter_rows(csvpath):
            self.load_row(row)

    def load_management_office_row(self, row: Row) -> None:
        mgmt_org = row.MANAGED_BY
        if mgmt_org in self.offices:
            self.stderr.write(
                f"Multiple management offices found for {mgmt_org}! "
                f"{row.FACILITY} vs. {self.offices[mgmt_org].row.FACILITY}"
            )
        self.offices[mgmt_org] = ManagementOffice(row=row, pad_bbl_and_addresses=set())

    def load_row(self, row: Row) -> None:
        mgmt_org = row.MANAGED_BY
        self.mgmt_orgs.add(mgmt_org)
        if mgmt_org in self.offices:
            office = self.offices[mgmt_org]
            pad_bbl = row.pad_bbl
            office.pad_bbl_and_addresses.add((pad_bbl, row.ADDRESS))
            if pad_bbl not in self.pad_bbls:
                self.pad_bbls[pad_bbl] = office
            elif (self.pad_bbls[pad_bbl] is not office and
                  pad_bbl not in self.bbls_with_many_offices):
                self.bbls_with_many_offices.add(pad_bbl)
                other_office = self.pad_bbls[pad_bbl]
                self.stdout.write(
                    f"BBL {pad_bbl} is managed by "
                    f"both {mgmt_org} and {other_office.row.MANAGED_BY}."
                )

    @transaction.atomic
    def populate_db(self) -> None:
        self.stdout.write(f'Populating database.')
        NychaOffice.objects.all().delete()
        for office in self.offices.values():
            office_model = NychaOffice(
                name=office.row.MANAGED_BY,
                address=office.row.full_address
            )
            office_model.save()
            NychaProperty.objects.bulk_create([
                NychaProperty(pad_bbl=bbl, address=address, office=office_model)
                for bbl, address in office.pad_bbl_and_addresses
            ])
        self.stdout.write(f'Done.')

    def report_stats(self) -> None:
        self.stdout.write(f'{len(self.offices)} management offices found.')
        orgs_without_offices = self.mgmt_orgs.difference(set(self.offices.keys()))
        if orgs_without_offices:
            self.stdout.write(
                f'Note that the following management orgs have no '
                f'management offices: {", ".join(orgs_without_offices)}.'
            )


class Command(BaseCommand):
    help = '''
    Load CSV of NYCHA data into the database.

    The CSV can be obtained from
    https://github.com/justFixNYC/nycha-scraper.
    '''

    def add_arguments(self, parser):
        parser.add_argument('csvfile')

    def handle(self, *args, **options):
        loader = NychaCsvLoader(self.stdout, self.stderr)
        loader.load_csv(Path(options['csvfile']))
        loader.report_stats()
        loader.populate_db()
