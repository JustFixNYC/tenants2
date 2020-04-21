from norent.models import Letter
from .factories import LetterFactory


class TestLetter:
    def test_str_works_on_brand_new_models(self):
        assert str(Letter()) == "Letter object (None)"

    def test_str_works_on_filled_out_models(self, db):
        letter = LetterFactory()
        assert str(letter) == "Boop Jones's no rent letter for 2020-05-01"
