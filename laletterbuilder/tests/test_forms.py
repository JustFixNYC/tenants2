from laletterbuilder.forms import ChooseLetterForm


class TestChooseLetter:
    def test_it_fails_when_nothing_is_filled(self):
        form = ChooseLetterForm(data={})
        form.full_clean()
        assert form.is_valid() is False

    def test_it_works_with_one_choice(self):
        form = ChooseLetterForm(data={"letter_type": "CA_HARASSMENT"})
        form.full_clean()
        assert form.is_valid()
        assert form.cleaned_data == {"letter_type": "CA_HARASSMENT"}
