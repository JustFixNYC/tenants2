// This file was auto-generated by commondatabuilder.
// Please don't edit it.

import { t } from "@lingui/macro";
import { li18n } from '../frontend/lib/i18n-lingui';

export type LaIssueChoice = "HEALTH__MOLD"|"HEALTH__PEELING_PAINT"|"HEALTH__RODENT_INFESTATION"|"UTILITIES__DEFECTIVE_ELECTRICITY"|"UTILITIES__WATER_LEAK"|"BUILDING_AND_SAFETY__HOLES"|"BUILDING_AND_SAFETY__BROKEN_LOCKS";

export const LaIssueChoices: LaIssueChoice[] = [
  "HEALTH__MOLD",
  "HEALTH__PEELING_PAINT",
  "HEALTH__RODENT_INFESTATION",
  "UTILITIES__DEFECTIVE_ELECTRICITY",
  "UTILITIES__WATER_LEAK",
  "BUILDING_AND_SAFETY__HOLES",
  "BUILDING_AND_SAFETY__BROKEN_LOCKS"
];

const LaIssueChoiceSet: Set<String> = new Set(LaIssueChoices);

export function isLaIssueChoice(choice: string): choice is LaIssueChoice {
  return LaIssueChoiceSet.has(choice);
}

export type LaIssueChoiceLabels = {
  [k in LaIssueChoice]: string;
};

export function getLaIssueChoiceLabels(): LaIssueChoiceLabels {
  return {
    HEALTH__MOLD: li18n._(t`Mold`),
    HEALTH__PEELING_PAINT: li18n._(t`Peeling paint`),
    HEALTH__RODENT_INFESTATION: li18n._(t`Rodent infestation`),
    UTILITIES__DEFECTIVE_ELECTRICITY: li18n._(t`Defective electricity`),
    UTILITIES__WATER_LEAK: li18n._(t`Water leak`),
    BUILDING_AND_SAFETY__HOLES: li18n._(t`Holes`),
    BUILDING_AND_SAFETY__BROKEN_LOCKS: li18n._(t`Broken locks`),
  };
}