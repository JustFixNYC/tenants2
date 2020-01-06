import React from 'react';
import { BaseFormFieldProps, RadiosFormField } from './form-fields';

/**
 * Choice when a user selects "yes" from a yes/no radio (specific to Django).
 */
export const YES_NO_RADIOS_TRUE = 'True';

/**
 * Choice when a user selects "no" from a yes/no radio (specific to Django).
 */
export const YES_NO_RADIOS_FALSE = 'False';

export interface YesNoRadiosFormFieldProps extends BaseFormFieldProps<string> {
  label: string;
  /**
   * Whether to make "yes" mean "no" and vice versa. Useful if the negation of a
   * question is more appropriate than the question itself, without having
   * to change a bunch of underlying logic.
   */
  flipLabels?: boolean;
}

/**
 * A set of yes/no radio buttons.
 */
export function YesNoRadiosFormField(props: YesNoRadiosFormFieldProps): JSX.Element {
  let [yesChoice, noChoice] = [YES_NO_RADIOS_TRUE, YES_NO_RADIOS_FALSE];

  if (props.flipLabels) {
    [yesChoice, noChoice] = [noChoice, yesChoice];
  }

  return <RadiosFormField {...props} choices={[
    [yesChoice, 'Yes'],
    [noChoice, 'No']
  ]} />;
}
