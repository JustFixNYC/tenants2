import { DjangoChoices } from "./common-data";
import { AllSessionInfo_customIssues } from "./queries/AllSessionInfo";
import { IssueAreaChoice } from "../../common-data/issue-area-choices";
import { IssueChoice, IssueChoices, getIssueChoiceLabels } from "../../common-data/issue-choices";

export function customIssueForArea(area: IssueAreaChoice, customIssues: AllSessionInfo_customIssues[]): string {
  for (let ci of customIssues) {
    if (ci.area === area) return ci.description;
  }
  return '';
}

export function issueArea(issue: IssueChoice): IssueAreaChoice {
  return issue.split('__')[0] as IssueAreaChoice;
}

export function areaIssueCount(area: IssueAreaChoice, issues: IssueChoice[], customIssues: AllSessionInfo_customIssues[]): number {
  return issues.reduce((total, issue) =>
    issueArea(issue) === area ? total + 1 : total,
  0) + customIssues.reduce((total, ci) =>
    ci.area === area ? total + 1 : total,
  0);
}

export function issuesForArea(area: IssueAreaChoice, issues: IssueChoice[]): IssueChoice[] {
  return issues.filter(issue => issueArea(issue) === area);
}

export function issueChoicesForArea(area: IssueAreaChoice): DjangoChoices {
  const labels = getIssueChoiceLabels();
  return IssueChoices
    .filter(choice => issueArea(choice) === area)
    .map(choice => [choice, labels[choice]] as [string, string]);
}
