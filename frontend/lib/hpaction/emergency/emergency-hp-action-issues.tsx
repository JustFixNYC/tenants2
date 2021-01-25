import {
  getIssueChoiceLabels,
  IssueChoice,
} from "../../../../common-data/issue-choices";
import { DjangoChoices } from "../../common-data";
import EMERGENCY_HPA_ISSUE_LIST from "../../../../common-data/emergency-hpa-issue-list.json";

export const EMERGENCY_HPA_ISSUE_SET = new Set(EMERGENCY_HPA_ISSUE_LIST);

export function getEmergencyHPAIssueChoices(): DjangoChoices {
  const labels = getIssueChoiceLabels();
  return EMERGENCY_HPA_ISSUE_LIST.map((issue) => [
    issue,
    labels[issue as IssueChoice],
  ]);
}

export function getEmergencyHPAIssueLabels(): string[] {
  const labels = getIssueChoiceLabels();
  return EMERGENCY_HPA_ISSUE_LIST.map((issue) => labels[issue as IssueChoice]);
}
