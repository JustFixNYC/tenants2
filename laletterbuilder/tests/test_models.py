import pytest

from .factories import HabitabilityLetterFactory, LaIssueFactory
from laletterbuilder.models import (
    LA_ISSUE_CHOICES,
    LA_MAILING_CHOICES,
    VALUE_MAXLEN,
    HabitabilityLetter,
)


class TestHabitabilityLetter:
    @pytest.mark.django_db
    def test_str_works_on_brand_new_models(self):
        assert str(HabitabilityLetter()) == "HabitabilityLetter object (None)"

    @pytest.mark.django_db
    def test_str_works_on_filled_out_models(self, db):
        letter = HabitabilityLetterFactory()
        assert str(letter) == "Boop Jones's Habitability LA Letter Builder letter"

    @pytest.mark.django_db
    def test_default_mail_choice(self, db):
        letter = HabitabilityLetterFactory()
        assert str(letter.mail_choice) == LA_MAILING_CHOICES.WE_WILL_MAIL

    @pytest.mark.django_db
    def test_default_email_to_landlord(self, db):
        letter = HabitabilityLetterFactory()
        assert str(letter.email_to_landlord) == "None"


class TestHabitabilityIssues:
    @pytest.mark.django_db
    def test_invalid_issue_raises_error(self, db):
        issue = LaIssueFactory(value="BOOP__FOO")

        with pytest.raises(ValueError) as exc_info:
            issue.clean()
        assert exc_info.value.args[0] == "'BOOP__FOO' is not a valid choice"

    @pytest.mark.django_db
    def test_valid_issue_raises_no_error(self, db):
        issue = LaIssueFactory(value="HEALTH__PEELING_PAINT__KITCHEN")
        try:
            issue.clean()
        except ValueError as exc:
            assert (
                False
            ), f"HEALTH__PEELING_PAINT__KITCHEN is a valid choice but raised an exception {exc}"

    def test_choices_have_valid_length(self):
        for value, _ in LA_ISSUE_CHOICES.choices:
            assert len(value) < VALUE_MAXLEN

    def test_choices_have_no_duplicates(self):
        values = set()
        for value, _ in LA_ISSUE_CHOICES.choices:
            assert value not in values
            values.add(value)
