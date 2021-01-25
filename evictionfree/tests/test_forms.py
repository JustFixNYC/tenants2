import pytest

from evictionfree.forms import CovidImpactForm, IndexNumberForm


class TestIndexNumberForm:
    def test_index_number_is_required_if_user_answers_yes(self):
        form = IndexNumberForm(data={"has_current_case": True})
        assert form.errors == {"index_number": ["This field is required."]}

    def test_it_sets_index_number_when_user_answers_yes(self):
        form = IndexNumberForm(data={"has_current_case": True, "index_number": "boop"})
        assert form.errors == {}
        assert form.cleaned_data["index_number"] == "boop"

    @pytest.mark.parametrize(
        "data",
        [
            {"has_current_case": False, "index_number": "boop"},
            {"has_current_case": False},
        ],
    )
    def test_it_clears_index_number_when_user_answers_no(self, data):
        form = IndexNumberForm(data=data)
        assert form.errors == {}
        assert form.cleaned_data["index_number"] == ""


class TestCovidImpactForm:
    def test_one_option_error_is_raised_on_empty_forms(self):
        form = CovidImpactForm(data={})
        assert form.errors == {"__all__": ["Please choose at least one option."]}

    def test_it_works_if_at_least_one_is_checked(self):
        form = CovidImpactForm(data={"has_financial_hardship": True})
        assert form.errors == {}
