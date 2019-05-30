import React from 'react';

import { TextualFormFieldProps, CheckboxView, TextualFormField, HiddenFormField, BaseFormFieldProps } from "./form-fields";
import { useState } from "react";
import { ProgressiveEnhancement } from "./progressive-enhancement";

/**
 * An "other" checkbox with a "please specify" text field. Semantically, the form field
 * is actually represented as text, rather than text and a boolean: if the text is empty, it
 * means the user didn't check the checkbox.
 */
export function EnhancedOtherCheckboxFormField(props: TextualFormFieldProps): JSX.Element {
  const [isChecked, setChecked] = useState(props.value !== '');
  const [prevOtherValue, setPrevOtherValue] = useState(props.value);
  const id = `${props.id}_checkbox`;
  const handleChange = (value: boolean) => {
    if (value) {
      props.onChange(prevOtherValue);
    } else {
      setPrevOtherValue(props.value);
      props.onChange('');
    }
    setChecked(value);
  };

  return (
    <CheckboxView
      id={id}
      checked={isChecked}
      disabled={props.isDisabled}
      onChange={(e) => handleChange(e.target.checked)}
      contentAfterLabel={isChecked
        ? <div className="jf-inset-field"><TextualFormField {...props} required /></div>
        : <HiddenFormField {...props} />
      }
    >Other</CheckboxView>
  );
}

export type ProgressiveOtherCheckboxFormFieldProps = BaseFormFieldProps<string> & {
  /** The label for the text field, if the baseline UI is shown. */
  baselineLabel: string,

  /**
   * The label for the "please specify" text field, if the progressively-enhanced
   * UI is shown.
   */
  enhancedLabel: string,

  /** Whether to disable progressive enhancement or not (primarily used for testing). */
  disableProgressiveEnhancement?: boolean
};

/**
 * A progressively-enhanced "other" checkbox with a "please specify" text field,
 * that simply appears as a text field without a checkbox on clients without JS.
 */
export function ProgressiveOtherCheckboxFormField(props: ProgressiveOtherCheckboxFormFieldProps): JSX.Element {
  const { baselineLabel, enhancedLabel, disableProgressiveEnhancement, ...baseProps } = props;
  return (
    <ProgressiveEnhancement
      disabled={disableProgressiveEnhancement}
      renderBaseline={() => <TextualFormField {...baseProps} label={baselineLabel} />}
      renderEnhanced={() => <EnhancedOtherCheckboxFormField {...baseProps} label={enhancedLabel} />}
    />
  );
}
