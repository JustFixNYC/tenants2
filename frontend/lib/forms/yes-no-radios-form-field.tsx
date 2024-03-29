import React from "react";
import { RadiosFormField, RadiosFormFieldProps } from "./form-fields";
import { ReactDjangoChoices } from "../common-data";
import { li18n } from "../i18n-lingui";
import { t } from "@lingui/macro";

export type YesNoChoice = "True" | "False";

/**
 * Choice when a user selects "yes" from a yes/no radio (specific to Django).
 */
export const YES_NO_RADIOS_TRUE: YesNoChoice = "True";

/**
 * Choice when a user selects "no" from a yes/no radio (specific to Django).
 */
export const YES_NO_RADIOS_FALSE: YesNoChoice = "False";

/**
 * Returns whether the given string value corresponds to a yes/no
 * radio choice (specific to Django).
 */
export function isYesNoChoice(value: string): value is YesNoChoice {
  return value === YES_NO_RADIOS_TRUE || value === YES_NO_RADIOS_FALSE;
}

/**
 * Converts a boolean true/false to the localized string "Yes" or "No".
 *
 * If passed null, returns an empty string.
 */
export function optionalBooleanToYesNoLabel(value: boolean | null): string {
  if (value === null) return "";
  return value ? li18n._(t`Yes`) : li18n._(t`No`);
}

/**
 * Converts a boolean true/false to a yes/no radio choice (specific to Django).
 *
 * If passed null, returns an empty string.
 */
export function optionalBooleanToYesNoChoice(
  value: boolean | null
): YesNoChoice | "" {
  if (value === null) return "";
  return value ? YES_NO_RADIOS_TRUE : YES_NO_RADIOS_FALSE;
}

type ChoiceOptions = {
  /**
   * Whether to make "yes" mean "no" and vice versa. Useful if the negation of a
   * question is more appropriate than the question itself, without having
   * to change a bunch of underlying logic.
   */
  flipLabels?: boolean;

  /** The label for the affirmative option, if different from "Yes". */
  yesLabel?: string;

  /** The label for the negative option, if different from "No". */
  noLabel?: string;
};

export type YesNoRadiosFormFieldProps = Omit<RadiosFormFieldProps, "choices"> &
  ChoiceOptions;

export function getYesNoChoices(options: ChoiceOptions): ReactDjangoChoices {
  let [yesChoice, noChoice] = [YES_NO_RADIOS_TRUE, YES_NO_RADIOS_FALSE];

  if (options.flipLabels) {
    [yesChoice, noChoice] = [noChoice, yesChoice];
  }

  return [
    [yesChoice, options.yesLabel || li18n._(t`Yes`)],
    [noChoice, options.noLabel || li18n._(t`No`)],
  ];
}

/**
 * A set of yes/no radio buttons.
 */
export function YesNoRadiosFormField(
  props: YesNoRadiosFormFieldProps
): JSX.Element {
  return <RadiosFormField {...props} choices={getYesNoChoices(props)} />;
}
