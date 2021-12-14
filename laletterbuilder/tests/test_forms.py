from laletterbuilder.forms import ChooseLetterTypeForm


class TestChooseLetterType:
    def test_it_works_when_nothing_is_filled(self):
        pass
        # TODO: make sure the form is not valid when something isn't selected

    def test_it_works_with_one_choice(self):
        form = ChooseLetterTypeForm(data={"letter_type": "CA_HARASSMENT"})
        form.full_clean()
        assert form.is_valid()
        assert form.cleaned_data == {"letter_type": "CA_HARASSMENT"}
