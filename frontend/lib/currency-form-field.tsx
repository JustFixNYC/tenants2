import React from 'react';
import { formatErrors } from "./form-errors";
import { bulmaClasses } from './bulma';
import { ariaBool } from './aria';
import { BaseFormFieldProps, renderLabel, LabelRenderer } from './form-fields';

/**
 * Properties for currency form field input.
 */
export interface CurrencyFormFieldProps extends BaseFormFieldProps<string> {
  label: string;
  renderLabel?: LabelRenderer;
  required?: boolean;
};

export function CurrencyFormField(props: CurrencyFormFieldProps): JSX.Element {
  let { ariaLabel, errorHelp } = formatErrors(props);

  return (
    <div className="field">
      {renderLabel(props.label, { htmlFor: props.id }, props.renderLabel)}
      <div className="control jf-currency">
        <input
          className={bulmaClasses('input', { 'is-danger': !!props.errors })}
          disabled={props.isDisabled}
          aria-invalid={ariaBool(!!props.errors)}
          aria-label={ariaLabel}
          name={props.name}
          id={props.id}
          type="text"
          value={props.value}
          required={props.required}
          onChange={(e) => props.onChange(e.target.value)}
        />
        <span className="jf-currency-symbol">$</span>
      </div>
      {errorHelp}
    </div>
  );
}
