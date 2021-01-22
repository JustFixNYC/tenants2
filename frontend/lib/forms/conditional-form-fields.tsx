import React from "react";

import {
  YesNoRadiosFormFieldProps,
  YesNoRadiosFormField,
} from "./yes-no-radios-form-field";
import {
  BaseFormFieldProps,
  HiddenFormField,
  HiddenFormFieldProps,
} from "./form-fields";

type WithHidden = { hidden: boolean };

type ConditionalYesNoRadiosFieldProps = YesNoRadiosFormFieldProps & WithHidden;

/** Hide the given form field by default (for use with conditional form fields). */
export function hideByDefault<T>(
  props: BaseFormFieldProps<T>
): BaseFormFieldProps<T> & WithHidden {
  return { ...props, hidden: true };
}

/**
 * A yes/no radios form field, but conditionally rendered.  It always
 * renders at least an <input type="hidden"> to ensure that progressive
 * enhancement will still work.
 */
export const ConditionalYesNoRadiosFormField: React.FC<ConditionalYesNoRadiosFieldProps> = (
  props
) => (
  <ConditionalFormField {...props}>
    <YesNoRadiosFormField {...props} />
  </ConditionalFormField>
);

export const ConditionalFormField: React.FC<
  HiddenFormFieldProps &
    WithHidden & {
      children: JSX.Element;
    }
> = (props) => {
  if (!props.hidden || props.errors) {
    return props.children;
  }
  return <HiddenFormField {...props} />;
};
