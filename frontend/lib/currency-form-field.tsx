import React from 'react';
import { formatErrors } from "./form-errors";
import { bulmaClasses } from './bulma';
import { ariaBool } from './aria';
import { BaseFormFieldProps, renderLabel, LabelRenderer } from './form-fields';
import { KEY_ENTER } from './key-codes';

/**
 * Properties for currency form field input.
 */
export interface CurrencyFormFieldProps extends BaseFormFieldProps<string> {
  label: string;
  renderLabel?: LabelRenderer;
  required?: boolean;
};

type State = {
  currentText: string
};

// https://stackoverflow.com/a/2901298
function numberWithCommas(x: string|number): string {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function normalizeCurrency(value: string): string {
  const amount = parseCurrency(value);
  if (amount !== null) {
    return numberWithCommas(amount.toFixed(2));
  }
  return '';
}

function stripNonDecimalChars(value: string): string {
  return value.replace(/[,$]/g, '')
}

export function parseCurrency(value: string): number|null {
  const amount = parseFloat(stripNonDecimalChars(value));
  if (isNaN(amount)) {
    return null;
  }
  return amount;
}

export class CurrencyFormField extends React.Component<CurrencyFormFieldProps, State> {
  constructor(props: CurrencyFormFieldProps) {
    super(props);
    this.state = {
      currentText: normalizeCurrency(this.props.value)
    };
  }

  componentDidUpdate(prevProps: CurrencyFormFieldProps, prevState: State) {
    if (prevProps.value !== this.props.value) {
      const currentText = normalizeCurrency(this.props.value);
      if (this.state.currentText !== currentText) {
        this.setState({ currentText });
      }
    }
  }

  handleChange(value: string) {
    this.setState({ currentText: value });
  }

  handleBlur() {
    const newText = normalizeCurrency(this.state.currentText);
    this.setState({ currentText: newText });
    this.props.onChange(stripNonDecimalChars(newText));
  }

  render() {
    const { props } = this;
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
            value={this.state.currentText}
            required={props.required}
            onChange={(e) => this.handleChange(e.target.value)}
            onBlur={() => this.handleBlur()}
            onKeyDown={(e) => e.keyCode === KEY_ENTER && this.handleBlur()}
          />
          <span className="jf-currency-symbol">$</span>
        </div>
        {errorHelp}
      </div>
    );
  }
}
