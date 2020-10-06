from norent.models import Letter, RentPeriod
from .factories import LetterFactory, RentPeriodFactory


class TestLetter:
    def test_str_works_on_brand_new_models(self):
        assert str(Letter()) == "Letter object (None)"

    def test_str_works_on_filled_out_models(self, db):
        letter = LetterFactory()
        assert str(letter) == "Boop Jones's no rent letter for 2020-05-01"

    def test_latest_rent_period_works_on_brand_new_models(self, db):
        letter = LetterFactory()
        letter.rent_periods.clear()
        assert letter.latest_rent_period is None

    def test_latest_rent_period_works_on_filled_out_models(self, db):
        letter = LetterFactory()
        letter.rent_periods.add(RentPeriodFactory.from_iso("2020-10-01"))
        assert str(letter.latest_rent_period.payment_date) == "2020-10-01"


class TestRentPeriod:
    def test_find_by_iso_date_works(self, db):
        RentPeriodFactory.from_iso("2020-10-01")
        assert RentPeriod.objects.find_by_iso_date("2020-10-01") is not None
        assert RentPeriod.objects.find_by_iso_date("2020-05-01") is None
