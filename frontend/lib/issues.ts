import { DjangoChoices } from "./common-data";
import { AllSessionInfo_customIssues } from "./queries/AllSessionInfo";

export const ISSUE_AREA_CHOICES = require('../../common-data/issue-area-choices.json') as DjangoChoices;

export const ISSUE_CHOICES = require('../../common-data/issue-choices.json') as DjangoChoices;

export function customIssueForArea(area: string, customIssues: AllSessionInfo_customIssues[]): string {
  for (let ci of customIssues) {
    if (ci.area === area) return ci.description;
  }
  return '';
}

export function issueArea(issue: string): string {
  return issue.split('__')[0];
}

export function areaIssueCount(area: string, issues: string[], customIssues: AllSessionInfo_customIssues[]): number {
  return issues.reduce((total, issue) =>
    issueArea(issue) === area ? total + 1 : total,
  0) + customIssues.reduce((total, ci) =>
    ci.area === area ? total + 1 : total,
  0);
}

export function issuesForArea(area: string, issues: string[]): string[] {
  return issues.filter(issue => issueArea(issue) === area);
}

export function issueChoicesForArea(area: string): DjangoChoices {
  return ISSUE_CHOICES.filter(([value, label]) => issueArea(value) === area);
}
