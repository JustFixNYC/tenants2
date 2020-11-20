from typing import NamedTuple, Tuple, List, Optional
from issues.models import ISSUE_CHOICES


class IssueMerger(NamedTuple):
    values: Tuple[str, ...]

    def merge_issues(self, issues: List['Issue']) -> List['Issue']:
        to_merge: List[Issue] = []
        result: List[Issue] = []

        for issue in issues:
            if issue.value in self.values:
                to_merge.append(issue)
            else:
                result.append(issue)

        if to_merge:
            result.append(Issue(
                area=to_merge[0].area,
                description=" & ".join(iss.description for iss in to_merge)
            ))

        return result


class Issue(NamedTuple):
    area: str
    description: str
    value: Optional[str] = None


def merge_issue_namedtuples(issues: List[Issue], mergers: List[IssueMerger]) -> List[Issue]:
    for merger in mergers:
        issues = merger.merge_issues(issues)
    return issues


def merge_issue_models(issue_models, mergers: List[IssueMerger]) -> List[Issue]:
    issues: List[Issue] = []
    for issue_model in issue_models:
        issue = Issue(
            area=issue_model.area,
            description=ISSUE_CHOICES.get_label(issue_model.value),
            value=issue_model.value,
        )
        issues.append(issue)
    return merge_issue_namedtuples(issues, mergers)
