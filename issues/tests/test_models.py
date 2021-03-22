import re
import pytest
import freezegun
from django.core.exceptions import ValidationError

from users.tests.factories import UserFactory, SecondUserFactory
from issues import models


def test_issue_choice_areas_are_valid():
    areas = set([value for (value, _) in models.ISSUE_AREA_CHOICES.choices])
    for value, _ in models.ISSUE_CHOICES.choices:
        area = models.get_issue_area(value)
        assert area in areas


def test_choices_have_no_duplicates():
    values = set()
    for value, _ in models.ISSUE_CHOICES.choices:
        assert value not in values
        values.add(value)


def test_choices_are_short_enough_for_hp_action_forms():
    # Currently LHI's HP Action Form PDF generator will create
    # an addendum if issue names are too long, which clerks sometimes
    # reject, so for now we're making sure that the issue lengths
    # are short enough to not trigger an addendum.
    for _, label in models.ISSUE_CHOICES.choices:
        assert len(label) <= 30


def test_choices_have_valid_chars():
    pattern = re.compile(r"[A-Z_]+")
    violations = []
    for value, _ in models.ISSUE_CHOICES.choices:
        if not pattern.fullmatch(value):
            violations.append(value)
    vstr = "\n".join(violations)
    if vstr:
        raise Exception(
            f"The following issue choices consist of more "
            f"than underscores and uppercase letters: {vstr}"
        )


def test_choices_have_valid_length():
    for value, _ in models.ISSUE_AREA_CHOICES.choices:
        assert len(value) < models.VALUE_MAXLEN
    for value, _ in models.ISSUE_CHOICES.choices:
        assert len(value) < models.VALUE_MAXLEN


def test_issue_raises_err_on_mismatched_area():
    issue = models.Issue(area="BLAH", value="BOOP__FOO")
    with pytest.raises(ValidationError) as exc_info:
        issue.clean()
    assert exc_info.value.args[0] == "Issue BOOP__FOO does not match area BLAH"


class BaseTest:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, db):
        self.user = UserFactory.create()


class TestSetAreaIssuesForUser(BaseTest):
    def set_area_issues(self, *args, **kwargs):
        models.Issue.objects.set_area_issues_for_user(self.user, *args, **kwargs)

    def get_area_issues(self, *args, **kwargs):
        return models.Issue.objects.get_area_issues_for_user(self.user, *args, **kwargs)

    def get_issue(self, *args, **kwargs):
        return models.Issue.objects.get(*args, **kwargs)

    def test_models_are_created_and_persist(self):
        with freezegun.freeze_time("2018-01-02"):
            self.set_area_issues("HOME", ["HOME__RATS"])
        model = self.get_issue(value="HOME__RATS")
        assert str(model.updated_at.date()) == "2018-01-02"
        with freezegun.freeze_time("2020-01-03"):
            self.set_area_issues("HOME", ["HOME__MICE", "HOME__RATS"])
        model.refresh_from_db()
        assert str(model.updated_at.date()) == "2018-01-02"

    def test_models_are_deleted(self):
        self.set_area_issues("HOME", ["HOME__RATS"])
        model = self.get_issue(value="HOME__RATS")
        self.set_area_issues("HOME", [])
        with pytest.raises(models.Issue.DoesNotExist):
            model.refresh_from_db()

    def test_duplicate_models_are_not_created(self):
        self.set_area_issues("HOME", ["HOME__RATS", "HOME__RATS"])
        assert self.get_area_issues("HOME") == ["HOME__RATS"]

    def test_issues_from_other_areas_are_not_clobbered(self):
        self.set_area_issues("HOME", ["HOME__RATS"])
        self.set_area_issues("BEDROOMS", ["BEDROOMS__PAINT"])
        assert self.get_area_issues("HOME") == ["HOME__RATS"]
        assert self.get_area_issues("BEDROOMS") == ["BEDROOMS__PAINT"]

    def test_issues_for_other_users_are_not_clobbered(self):
        user2 = SecondUserFactory()
        self.set_area_issues("HOME", ["HOME__MICE"])
        models.Issue.objects.set_area_issues_for_user(user2, "HOME", ["HOME__RATS"])
        assert self.get_area_issues("HOME") == ["HOME__MICE"]
        assert models.Issue.objects.get_area_issues_for_user(user2, "HOME") == ["HOME__RATS"]
