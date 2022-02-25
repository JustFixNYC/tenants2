import { DjangoChoices } from "../common-data";
import { AllSessionInfo_customIssuesV2 } from "../queries/AllSessionInfo";
import { IssueAreaChoice } from "../../../common-data/issue-area-choices";
import {
  IssueChoice,
  IssueChoices,
  getIssueChoiceLabels,
} from "../../../common-data/issue-choices";
import { LaIssueAreaChoice } from "../../../common-data/issue-area-choices-laletterbuilder";
import {
  getLaIssueChoiceLabels,
  LaIssueChoice,
  LaIssueChoices,
} from "../../../common-data/issue-choices-laletterbuilder";

type CustomIssue = AllSessionInfo_customIssuesV2;

export function customIssuesForArea(
  area: IssueAreaChoice,
  customIssues: CustomIssue[]
): CustomIssue[] {
  return customIssues.filter((ci) => ci.area === area);
}

export function issueArea(issue: IssueChoice): IssueAreaChoice {
  return issue.split("__")[0] as IssueAreaChoice;
}

export function areaIssueCount(
  area: IssueAreaChoice,
  issues: IssueChoice[],
  customIssues: AllSessionInfo_customIssuesV2[]
): number {
  return (
    issues.reduce(
      (total, issue) => (issueArea(issue) === area ? total + 1 : total),
      0
    ) + customIssuesForArea(area, customIssues).length
  );
}

export function issuesForArea(
  area: IssueAreaChoice,
  issues: IssueChoice[]
): IssueChoice[] {
  return issues.filter((issue) => issueArea(issue) === area);
}

export function issueChoicesForArea(area: IssueAreaChoice): DjangoChoices {
  const labels = getIssueChoiceLabels();
  return IssueChoices.filter((choice) => issueArea(choice) === area).map(
    (choice) => [choice, labels[choice]] as [string, string]
  );
}

export function laIssueArea(issue: LaIssueChoice): LaIssueAreaChoice {
  return issue.split("__")[0] as LaIssueAreaChoice;
}

export function laIssueChoicesForArea(area: LaIssueAreaChoice): DjangoChoices {
  const labels = getLaIssueChoiceLabels();
  return LaIssueChoices.filter((choice) => laIssueArea(choice) === area).map(
    (choice) => [choice, labels[choice]] as [string, string]
  );
}
