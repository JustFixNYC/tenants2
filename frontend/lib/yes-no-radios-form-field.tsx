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
}

/**
 * A set of yes/no radio buttons.
 */
export function YesNoRadiosFormField(props: YesNoRadiosFormFieldProps): JSX.Element {
  return <RadiosFormField {...props} choices={[
    [YES_NO_RADIOS_TRUE, 'Yes'],
    [YES_NO_RADIOS_FALSE, 'No']
  ]} />;
}
