from issues.models import Issue as IssueModel, ISSUE_CHOICES
from hpaction.merge_issues import IssueMerger, Issue, merge_issue_models


HEAT_AND_GAS_MERGER = IssueMerger((ISSUE_CHOICES.HOME__NO_HEAT, ISSUE_CHOICES.HOME__NO_GAS))


def mkissue(value: str):
    model = IssueModel(area=value.split("__")[0], value=value)
    model.full_clean(exclude=["user"])
    return model


def test_it_merges_issues():
    assert merge_issue_models(
        [
            mkissue(ISSUE_CHOICES.HOME__PAINTING),
            mkissue(ISSUE_CHOICES.HOME__NO_HEAT),
            mkissue(ISSUE_CHOICES.HOME__NO_GAS),
        ],
        [HEAT_AND_GAS_MERGER],
    ) == [
        Issue(area="HOME", description="Apartment needs painting", value="HOME__PAINTING"),
        Issue(area="HOME", description="No Heat & No Gas"),
    ]


def test_it_trivially_merges_issues():
    assert merge_issue_models(
        [
            mkissue(ISSUE_CHOICES.HOME__PAINTING),
            mkissue(ISSUE_CHOICES.HOME__NO_HEAT),
        ],
        [HEAT_AND_GAS_MERGER],
    ) == [
        Issue(area="HOME", description="Apartment needs painting", value="HOME__PAINTING"),
        Issue(area="HOME", description="No heat"),
    ]


def test_it_works_when_not_merging():
    assert merge_issue_models([mkissue(ISSUE_CHOICES.HOME__PAINTING)], [HEAT_AND_GAS_MERGER]) == [
        Issue(area="HOME", description="Apartment needs painting", value="HOME__PAINTING"),
    ]
