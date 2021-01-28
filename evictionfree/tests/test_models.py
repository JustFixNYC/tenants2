from evictionfree.models import SubmittedHardshipDeclaration
from .factories import SubmittedHardshipDeclarationFactory


class TestSubmittedHardshipDeclaration:
    def test_str_works_on_brand_new_models(self):
        assert str(SubmittedHardshipDeclaration()) == "SubmittedHardshipDeclaration object (None)"

    def test_str_works_on_filled_out_models(self, db):
        decl = SubmittedHardshipDeclarationFactory()
        assert str(decl) == "Boop Jones's hardship declaration"
