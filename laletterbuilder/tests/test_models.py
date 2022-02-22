from laletterbuilder.models import HabitabilityLetter
from factories import HabitabilityLetterFactory


class TestHabitabilityLetter:
    def test_str_works_on_brand_new_models(self):
        assert str(HabitabilityLetter()) == "HabitabilityLetter object (None)"

    def test_str_works_on_filled_out_models(self, db):
        decl = HabitabilityLetterFactory()
        assert str(decl) == "Boop Jones's Habitability LA Letter Builder letter"
