from norent.models import Letter
from .factories import LetterFactory, LaterRentPeriodFactory


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
        letter.rent_periods.add(LaterRentPeriodFactory())
        assert str(letter.latest_rent_period.payment_date) == "2020-10-01"
