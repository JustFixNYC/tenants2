import pytest

from nycdb.models import HPDRegistration, HPDContact
from . import fixtures


def test_tiny_landlord_works(nycdb):
    tiny = fixtures.load_hpd_registration("tiny-landlord.json")
    assert tiny.get_management_company() is None
    boop = tiny.get_landlord()
    assert boop is not None
    assert boop.name == "BOOP JONES"
    assert boop.address.lines_for_mailing == [
        "124 99TH STREET",
        "Brooklyn, NY 11999"
    ]


@pytest.mark.parametrize("model", [
    HPDRegistration,
    HPDContact,
])
def test_error_raised_when_nycdb_not_enabled(model):
    with pytest.raises(Exception, match='NYCDB integration is disabled'):
        model.objects.all()


class TestHPDContact:
    def test_full_name_works(self):
        assert HPDContact().full_name == ''
        assert HPDContact(firstname='a', lastname='b').full_name == "a b"
        assert HPDContact(firstname='a').full_name == "a"
        assert HPDContact(lastname='b').full_name == "b"

    def test_street_address_works(self):
        assert HPDContact().street_address == ''
        assert HPDContact(
            businesshousenumber='23',
            businessstreetname="blarg st"
        ).street_address == '23 blarg st'
