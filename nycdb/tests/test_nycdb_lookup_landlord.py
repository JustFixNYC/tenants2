from io import StringIO
from django.core.management import call_command

from . import fixtures


def test_it_works_with_tiny_landlord(nycdb):
    tiny = fixtures.load_hpd_registration("tiny-landlord.json")
    out = StringIO()
    call_command('nycdb_lookup_landlord', tiny.pad_bbl, stdout=out)
    assert 'BOOP JONES' in out.getvalue()
