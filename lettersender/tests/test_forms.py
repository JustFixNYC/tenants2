from lettersender.forms import GoodCauseIssuesForm


class TestIssuesForm:
    def test_it_requires_at_least_one_issue(self):
        form = GoodCauseIssuesForm(data={})
        form.full_clean()
        assert form.errors == {"__all__": ["Please select at least one repair issue."]}
