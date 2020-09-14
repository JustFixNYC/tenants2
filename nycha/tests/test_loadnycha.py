from nycha.management.commands.loadnycha import Row
from nycha.models import NychaProperty


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


def test_command_works(loaded_nycha_csv_data):
    assert loaded_nycha_csv_data.stderr == (
        'Multiple management offices found for RICHMOND TERRACE! '
        'ANOTHER DEVELOPMENT MANAGEMENT OFFICE vs. DEVELOPMENT MANAGEMENT OFFICE\n'
    )
    assert loaded_nycha_csv_data.stdout == (
        'BBL 3005380001 is managed by both RED HOOK EAST and RED HOOK WEST.\n'
        '5 management offices found.\n'
        'Note that the following management orgs have no management offices: VACANT LAND.\n'
        'Populating database.\n'
        'Done.\n'
    )
    prop = NychaProperty.objects.get(pad_bbl='2022150116', address='5210 BROADWAY')
    assert prop.development == 'MARBLE HILL'
    assert prop.office.name == 'MARBLE HILL'
    assert prop.office.address == '5220 BROADWAY\nBRONX, NY 10463'
    assert prop.office.city == 'BRONX'
    assert prop.office.state == 'NY'
    assert prop.office.zip_code == '10463'
    assert prop.office.primary_line == '5220 BROADWAY'


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

    def test_full_address_works(self):
        row = Row(**ROW_DICT)
        assert row.full_address == '5210 BROADWAY\nBRONX, NY 10463'

        row.BOROUGH = 'MANHATTAN'
        assert row.full_address == '5210 BROADWAY\nNEW YORK, NY 10463'
