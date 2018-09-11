import React from 'react';

import { WithFormFieldErrors, formatErrors } from "./form-errors";
import { DjangoChoices } from "./common-data";
import { bulmaClasses } from './bulma';
import { ariaBool } from './aria';

/**
 * Base properties that form fields need to have.
 */
export interface BaseFormFieldProps<T> extends WithFormFieldErrors {
  /** Event handler to call when the field's value changes. */
  onChange: (value: T) => void;

  /** The current value of the field. */
  value: T;

  /**
   * The machine-readable name of the field
   * (e.g. the value of the "name" attribute in an <input> field).
   **/
  name: string;

  /** Whether the form field is disabled. */
  isDisabled: boolean;
}

export interface ChoiceFormFieldProps extends BaseFormFieldProps<string> {
  choices: DjangoChoices;
  label: string;
}

/** A JSX component that encapsulates a set of radio buttons. */
export function RadiosFormField(props: ChoiceFormFieldProps): JSX.Element {
  let { ariaLabel, errorHelp } = formatErrors(props);

  return (
    <div className="field" role="group" aria-label={ariaLabel}>
      <label className="label" aria-hidden="true">{props.label}</label>
      <div className="control">
        {props.choices.map(([choice, label]) => (
          <label className="radio jf-radio" key={choice}>
            <input
              type="radio"
              name={props.name}
              value={choice}
              checked={props.value === choice}
              aria-invalid={ariaBool(!!props.errors)}
              disabled={props.isDisabled}
              onChange={(e) => props.onChange(choice) }
            /> {label}
          </label>
        ))}
      </div>
      {errorHelp}
    </div>
  );
}

/** A JSX component that encapsulates a <select> tag. */
export function SelectFormField(props: ChoiceFormFieldProps): JSX.Element {
  let { ariaLabel, errorHelp } = formatErrors(props);

  // TODO: Assign an id to the input and make the label point to it.
  return (
    <div className="field">
      <label className="label">{props.label}</label>
      <div className="control">
        <div className={bulmaClasses('select', {
          'is-danger': !!props.errors
        })}>
          <select
            value={props.value}
            aria-invalid={ariaBool(!!props.errors)}
            aria-label={ariaLabel}
            disabled={props.isDisabled}
            name={props.name}
            onChange={(e) => props.onChange(e.target.value)}
          >
            <option value=""></option>
            {props.choices.map(([choice, label]) => (
              <option key={choice} value={choice}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      {errorHelp}
    </div>
  );
}

export interface MultiChoiceFormFieldProps extends BaseFormFieldProps<string[]> {
  choices: DjangoChoices;
  label: string;
}

export function toggleChoice(choice: string, checked: boolean, choices: string[]): string[] {
  if (checked) {
    return [...choices, choice];
  } else {
    return choices.filter(c => c !== choice);
  }
}

/** A JSX component that encapsulates a set of checkboxes. */
export function MultiCheckboxFormField(props: MultiChoiceFormFieldProps): JSX.Element {
  let { ariaLabel, errorHelp } = formatErrors(props);

  return (
    <div className="field" role="group" aria-label={ariaLabel}>
      <label className="label" aria-hidden="true">{props.label}</label>
      <div className="control">
        {props.choices.map(([choice, label]) => (
          <label className="checkbox jf-checkbox" key={choice}>
            <input
              type="checkbox"
              checked={props.value.indexOf(choice) !== -1}
              aria-invalid={ariaBool(!!props.errors)}
              disabled={props.isDisabled}
              onChange={(e) => props.onChange(toggleChoice(choice, e.target.checked, props.value))}
            /> {label}
          </label>
        ))}
      </div>
      {errorHelp}
    </div>
  );
}

export interface BooleanFormFieldProps extends BaseFormFieldProps<boolean> {
  children: any;
}

export function CheckboxFormField(props: BooleanFormFieldProps): JSX.Element {
  const { errorHelp } = formatErrors(props);

  return (
    <div className="field">
      <label className="checkbox">
        <input
          type="checkbox"
          checked={props.value}
          aria-invalid={ariaBool(!!props.errors)}
          disabled={props.isDisabled}
          onChange={(e) => props.onChange(e.target.checked)}
        /> {props.children}
      </label>
      {errorHelp}
    </div>
  );
}

/**
 * Valid types of textual form field input.
 */
export type TextualInputType = 'text'|'password'|'date';

/**
 * Properties for textual form field input.
 */
export interface TextualFormFieldProps extends BaseFormFieldProps<string> {
  type?: TextualInputType;
  label: string;
};

/** A JSX component for textual form input. */
export function TextualFormField(props: TextualFormFieldProps): JSX.Element {
  const type: TextualInputType = props.type || 'text';
  let { ariaLabel, errorHelp } = formatErrors(props);

  // TODO: Assign an id to the input and make the label point to it.
  return (
    <div className="field">
      <label className="label">{props.label}</label>
      <div className="control">
        <input
          className={bulmaClasses('input', {
            'is-danger': !!props.errors
          })}
          disabled={props.isDisabled}
          aria-invalid={ariaBool(!!props.errors)}
          aria-label={ariaLabel}
          name={props.name}
          type={type}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        />
      </div>
      {errorHelp}
    </div>
  );
}

/** A JSX component that encapsulates a <textarea>. */
export function TextareaFormField(props: TextualFormFieldProps): JSX.Element {
  let { ariaLabel, errorHelp } = formatErrors(props);

  // TODO: Assign an id to the input and make the label point to it.
  return (
    <div className="field">
      <label className="label">{props.label}</label>
      <div className="control">
        <textarea
          className={bulmaClasses('textarea', { 'is-danger': !!props.errors })}
          disabled={props.isDisabled}
          aria-invalid={ariaBool(!!props.errors)}
          aria-label={ariaLabel}
          name={props.name}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        />
      </div>
      {errorHelp}
    </div>
  );
}
