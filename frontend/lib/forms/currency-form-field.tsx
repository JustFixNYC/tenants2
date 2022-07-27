import React, { RefObject } from "react";
import { formatErrors } from "./form-errors";
import { bulmaClasses } from "../ui/bulma";
import { ariaBool } from "../ui/aria";
import { BaseFormFieldProps, renderLabel, LabelRenderer } from "./form-fields";
import { KEY_ENTER } from "../util/key-codes";

/**
 * Properties for currency form field input.
 */
export interface CurrencyFormFieldProps extends BaseFormFieldProps<string> {
  label: string;
  renderLabel?: LabelRenderer;
  required?: boolean;
}

type State = {
  isFocused: boolean;
  currentText: string;
};

// https://stackoverflow.com/a/2901298
function numberWithCommas(x: string | number): string {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function normalizeCurrency(value: string): string {
  const amount = parseCurrency(value);
  if (amount !== null) {
    return numberWithCommas(amount.toFixed(2));
  }
  return "";
}

function stripNonDecimalChars(value: string): string {
  return value.replace(/[,$]/g, "");
}

export function parseCurrency(value: string): number | null {
  const amount = parseFloat(stripNonDecimalChars(value));
  if (isNaN(amount)) {
    return null;
  }
  return amount;
}

export class CurrencyFormField extends React.Component<
  CurrencyFormFieldProps,
  State
> {
  inputRef: RefObject<HTMLInputElement> = React.createRef();

  constructor(props: CurrencyFormFieldProps) {
    super(props);
    this.state = {
      isFocused: false,
      currentText: normalizeCurrency(this.props.value),
    };
  }

  componentDidMount() {
    const { activeElement } = document;
    if (activeElement && activeElement === this.inputRef.current) {
      this.setState({ isFocused: true });
    }
  }

  componentDidUpdate(prevProps: CurrencyFormFieldProps, prevState: State) {
    if (prevProps.value !== this.props.value) {
      this.setState({ currentText: normalizeCurrency(this.props.value) });
    }
  }

  handleChange(value: string) {
    if (this.state.isFocused) {
      this.setState({ currentText: value });
    } else {
      this.commitValue(value);
    }
  }

  handleFocus() {
    this.setState({ isFocused: true });
  }

  handleBlur() {
    this.setState({ isFocused: false });
    this.commitValue();
  }

  commitValue(value = this.state.currentText) {
    const newText = normalizeCurrency(value);
    this.setState({ currentText: newText });
    this.props.onChange(stripNonDecimalChars(newText));
  }

  render() {
    const { props } = this;
    let { ariaLabel, errorHelp } = formatErrors(props);

    return (
      <div className="field">
        {errorHelp}
        {renderLabel(props.label, { htmlFor: props.id }, props.renderLabel)}
        <div className="control jf-currency">
          <input
            ref={this.inputRef}
            className={bulmaClasses("input", { "is-danger": !!props.errors })}
            disabled={props.isDisabled}
            aria-invalid={ariaBool(!!props.errors)}
            aria-label={ariaLabel}
            name={props.name}
            id={props.id}
            type="text"
            value={this.state.currentText}
            required={props.required}
            onChange={(e) => this.handleChange(e.target.value)}
            onFocus={() => this.handleFocus()}
            onBlur={() => this.handleBlur()}
            onKeyDown={(e) => e.keyCode === KEY_ENTER && this.commitValue()}
          />
          <span className="jf-currency-symbol">$</span>
        </div>
      </div>
    );
  }
}
