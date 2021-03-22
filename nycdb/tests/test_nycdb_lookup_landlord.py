from typing import List
from io import StringIO
from django.core.management import call_command

from . import fixtures


def get_output(fixture_filename: str, extra_args: List[str] = None, reg_attr="pad_bbl") -> str:
    if extra_args is None:
        extra_args = []
    reg = fixtures.load_hpd_registration(fixture_filename)
    out = StringIO()
    call_command("nycdb_lookup_landlord", getattr(reg, reg_attr), *extra_args, stdout=out)
    return out.getvalue()


def test_it_works_with_tiny_landlord(nycdb):
    assert "    BOOP JONES" in get_output("tiny-landlord.json", reg_attr="pad_bbl")
    assert "    BOOP JONES" in get_output("tiny-landlord.json", reg_attr="pad_bin")


def test_it_works_with_medium_landlord(nycdb):
    output = get_output("medium-landlord.json")
    assert "    LANDLORDO CALRISSIAN" in output
    assert "    FUNKY APARTMENT MANAGEMENT" in output


def test_it_works_with_medium_landlord_and_no_prefer_head_officer(nycdb):
    output = get_output("medium-landlord.json", ["--no-prefer-head-officer"])
    assert "    ULTRA DEVELOPERS, LLC" in output
    assert "    FUNKY APARTMENT MANAGEMENT" in output


def test_it_dumps_model_json(nycdb):
    output = get_output("tiny-landlord.json", ["--dump-models"])
    assert '"firstname": "BOOP"' in output
