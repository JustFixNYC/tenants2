from pathlib import Path
from io import StringIO
from django.core.management import call_command


CSV_FILE = Path(__file__).parent.resolve() / 'test_loadnycha.csv'


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
