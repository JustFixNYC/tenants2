// This file was auto-generated by commondatabuilder.
// Please don't edit it.

import { t } from "@lingui/macro";
import { li18n } from '../frontend/lib/i18n-lingui';

export type LaMailingChoice = "WE_WILL_MAIL"|"USER_WILL_MAIL";

export const LaMailingChoices: LaMailingChoice[] = [
  "WE_WILL_MAIL",
  "USER_WILL_MAIL"
];

const LaMailingChoiceSet: Set<String> = new Set(LaMailingChoices);

export function isLaMailingChoice(choice: string): choice is LaMailingChoice {
  return LaMailingChoiceSet.has(choice);
}

export type LaMailingChoiceLabels = {
  [k in LaMailingChoice]: string;
};

export function getLaMailingChoiceLabels(): LaMailingChoiceLabels {
  return {
    WE_WILL_MAIL: li18n._(t`Mail for me`),
    USER_WILL_MAIL: li18n._(t`Mail myself`),
  };
}
