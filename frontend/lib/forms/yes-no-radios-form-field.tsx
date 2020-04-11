import React from "react";
import { BaseFormFieldProps, RadiosFormField } from "./form-fields";
import { ReactDjangoChoices } from "../common-data";

/**
 * Choice when a user selects "yes" from a yes/no radio (specific to Django).
 */
export const YES_NO_RADIOS_TRUE = "True";

/**
 * Choice when a user selects "no" from a yes/no radio (specific to Django).
 */
export const YES_NO_RADIOS_FALSE = "False";

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

export interface YesNoRadiosFormFieldProps
  extends BaseFormFieldProps<string>,
    ChoiceOptions {
  label: string;
}

export function getYesNoChoices(options: ChoiceOptions): ReactDjangoChoices {
  let [yesChoice, noChoice] = [YES_NO_RADIOS_TRUE, YES_NO_RADIOS_FALSE];

  if (options.flipLabels) {
    [yesChoice, noChoice] = [noChoice, yesChoice];
  }

  return [
    [yesChoice, options.yesLabel || "Yes"],
    [noChoice, options.noLabel || "No"],
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
