import csv
from dataclasses import dataclass
from typing import Dict, Set, TextIO
from django.core.management.base import BaseCommand
import pydantic


# https://en.wikipedia.org/wiki/Borough,_Block_and_Lot
BOROUGH_NUMBERS = {
    'MANHATTAN': 1,
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

    def is_management_office(self) -> bool:
        return ('DEVELOPMENT MANAGEMENT OFFICE' in self.FACILITY and
                'SATELLITE' not in self.FACILITY)


@dataclass
class ManagementOffice:
    row: Row
    pad_bbls: Set[str]


class NychaCsvLoader:
    offices: Dict[str, ManagementOffice]
    mgmt_orgs: Set[str]
    stdout: TextIO
    stderr: TextIO

    def __init__(self, stdout: TextIO, stderr: TextIO) -> None:
        self.offices = {}
        self.mgmt_orgs = set()
        self.stderr = stderr
        self.stdout = stdout

    def load_csv(self, csvfile: TextIO) -> None:
        reader = csv.DictReader(csvfile)
        for dictrow in reader:
            row = Row(**dictrow)
            self.load_row(row)

    def load_row(self, row: Row) -> None:
        mgmt_org = row.MANAGED_BY
        if row.is_management_office():
            if mgmt_org in self.offices:
                self.stderr.write(
                    f"Multiple management offices found for {mgmt_org}! "
                    f"{row.FACILITY} vs. {self.offices[mgmt_org].row.FACILITY}"
                )
            self.offices[mgmt_org] = ManagementOffice(row=row, pad_bbls=set())
        self.mgmt_orgs.add(mgmt_org)
        if mgmt_org in self.offices:
            self.offices[mgmt_org].pad_bbls.add(row.pad_bbl)

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
        with open(options['csvfile'], 'r') as csvfile:
            loader.load_csv(csvfile)
        loader.report_stats()
