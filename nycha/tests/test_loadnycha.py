from pathlib import Path
from io import StringIO
from django.core.management import call_command

from nycha.management.commands.loadnycha import Row


CSV_FILE = Path(__file__).parent.resolve() / 'test_loadnycha.csv'

ROW_DICT = {
    'BOROUGH': 'BRONX',
    'BLOCK': '2215',
    'LOT': '116',
    'ADDRESS': '5210 BROADWAY',
    'ZIP CODE': '10463',
    'DEVELOPMENT': 'MARBLE HILL',
    'MANAGED BY': 'MARBLE HILL',
    'CD#': '8',
    'FACILITY': 'DEVELOPMENT MANAGEMENT OFFICE'
}


def test_it_works():
    out = StringIO()
    err = StringIO()
    call_command('loadnycha', str(CSV_FILE), stdout=out, stderr=err)
    assert err.getvalue() == (
        'Multiple management offices found for RICHMOND TERRACE! '
        'ANOTHER DEVELOPMENT MANAGEMENT OFFICE vs. DEVELOPMENT MANAGEMENT OFFICE\n'
    )
    assert out.getvalue() == (
        '3 management offices found.\n'
        'Note that the following management orgs have no management offices: VACANT LAND.\n'
    )


class TestRow:
    def test_pad_bbl_works(self):
        row = Row(**ROW_DICT)
        assert row.pad_bbl == '2022150116'

        row.BOROUGH = 'MANHATTAN'
        assert row.pad_bbl == '1022150116'

    def test_is_main_management_office_works(self):
        row = Row(**ROW_DICT)
        assert row.is_main_management_office() is True

        row.FACILITY = 'SATELLITE MANAGEMENT OFFICE'
        assert row.is_main_management_office() is False
