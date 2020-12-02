from nycha.models import NychaOffice, is_nycha_bbl


find_for_property = NychaOffice.objects.find_for_property


class TestFindForProperty:
    def test_returns_none_when_bbl_does_not_match(self, loaded_nycha_csv_data):
        assert find_for_property("123", "blah") is None

    def test_returns_office_when_bbl_has_one_office(self, loaded_nycha_csv_data):
        office = find_for_property("2022150116", "blarglergl")
        assert office.name == "MARBLE HILL"

    def test_returns_an_office_when_bbl_has_many_offices_but_address_narrowing_fails(
        self, loaded_nycha_csv_data
    ):
        office = find_for_property("3005380001", "blarglergl")
        assert office.name.startswith("RED HOOK")

    def test_returns_office_when_bbl_has_many_offices_and_address_narrowing_succeeds(
        self, loaded_nycha_csv_data
    ):
        office = find_for_property("3005380001", "453 COLUMBIA STREET, Brooklyn")
        assert office.name == "RED HOOK EAST"


def test_is_nycha_bbl_works(loaded_nycha_csv_data):
    assert is_nycha_bbl("123") is False
    assert is_nycha_bbl("2022150116") is True
