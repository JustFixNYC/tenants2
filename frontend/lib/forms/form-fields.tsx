import React, { DetailedHTMLProps, HTMLAttributes, useRef } from "react";

import { WithFormFieldErrors, formatErrors } from "./form-errors";
import { ReactDjangoChoice, ReactDjangoChoices } from "../common-data";
import { bulmaClasses } from "../ui/bulma";
import { ariaBool } from "../ui/aria";
import { SimpleProgressiveEnhancement } from "../ui/progressive-enhancement";
import { useAutoFocus } from "../ui/use-auto-focus";

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

  /**
   * The id attribute for the field. If the field actually contains multiple
   * input elements, this will be the prefix of the id attribute of every
   * element.
   */
  id: string;
}

/** The props for an HTML <label> element. */
export type LabelProps = React.DetailedHTMLProps<
  React.LabelHTMLAttributes<HTMLLabelElement>,
  HTMLLabelElement
>;

/** The props for an HTML <input> element. */
export type InputProps = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;

/**
 * A label renderer is a function that renders a JSX element containing
 * a <label> with the given text and the given props somewhere inside it.
 */
export type LabelRenderer = (
  label: string,
  labelProps: LabelProps
) => JSX.Element;

/**
 * The simplest possible label renderer, which just renders a label using
 * standard Bulma styling.
 */
export const renderSimpleLabel: LabelRenderer = (label, props) => (
  <label className="label" {...props}>
    {label}
  </label>
);

/**
 * Given label text, props, and an optional renderer, render a label.
 */
export function renderLabel(
  label: string,
  labelProps: LabelProps,
  renderer?: LabelRenderer
): JSX.Element {
  renderer = renderer || renderSimpleLabel;
  return renderer(label, labelProps);
}

export interface ChoiceFormFieldProps extends BaseFormFieldProps<string> {
  choices: ReactDjangoChoices;
  label: string;
  autoFocus?: boolean;
}

export const AutofocusedInput: React.FC<InputProps> = (props) => {
  const ref = useRef<HTMLInputElement | null>(null);

  useAutoFocus(ref, props.autoFocus);

  return <input ref={ref} {...props} />;
};

/** A JSX component that encapsulates a set of radio buttons. */
export function RadiosFormField(props: ChoiceFormFieldProps): JSX.Element {
  let { ariaLabel, errorHelp } = formatErrors(props);
  const idFor = (choice: string) => `${props.id}_${choice}`;

  return (
    <div className="field" role="group" aria-label={ariaLabel}>
      {props.label && (
        <label className="label" aria-hidden="true">
          {props.label}
        </label>
      )}
      <div className="control">
        {props.choices.map(([choice, label], i) => (
          <label
            htmlFor={idFor(choice)}
            className="radio jf-radio"
            key={choice}
          >
            <AutofocusedInput
              type="radio"
              name={props.name}
              id={idFor(choice)}
              value={choice}
              checked={props.value === choice}
              autoFocus={
                props.autoFocus &&
                // Autofocus if we're the currently-selected choice *or*
                // nothing is selected and we're the very first choice.
                (props.value === choice || (!props.value && i === 0))
              }
              aria-invalid={ariaBool(!!props.errors)}
              disabled={props.isDisabled}
              onChange={(e) => props.onChange(choice)}
            />{" "}
            <span className="jf-radio-symbol" />{" "}
            <span className="jf-label-text">
              <span className="subtitle is-5">{label}</span>
            </span>
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

  return (
    <div className="field">
      <label htmlFor={props.id} className="label">
        {props.label}
      </label>
      <div className="control">
        <div
          className={bulmaClasses("select", {
            "is-danger": !!props.errors,
          })}
        >
          <select
            value={props.value}
            aria-invalid={ariaBool(!!props.errors)}
            aria-label={ariaLabel}
            disabled={props.isDisabled}
            name={props.name}
            id={props.id}
            onChange={(e) => props.onChange(e.target.value)}
          >
            <option value=""></option>
            {props.choices.map(([choice, label]) => (
              <option key={choice} value={choice}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {errorHelp}
    </div>
  );
}

/**
 * An item for a multi-choice form field that can either be an actual
 * choice, or a JSX Element used to e.g. distinguish groups of choices
 * from one another.
 */
export type MultiChoiceFormFieldItem = ReactDjangoChoice | JSX.Element;

export interface MultiChoiceFormFieldProps
  extends BaseFormFieldProps<string[]> {
  choices: MultiChoiceFormFieldItem[];
  label: string;
}

export function toggleChoice(
  choice: string,
  checked: boolean,
  choices: string[]
): string[] {
  if (checked) {
    return [...choices, choice];
  } else {
    return choices.filter((c) => c !== choice);
  }
}

const MultiCheckboxFormFieldCheckbox: React.FC<
  Omit<MultiChoiceFormFieldProps, "choices"> & {
    choice: ReactDjangoChoice;
  }
> = (props) => {
  const [choice, label] = props.choice;
  const id = `${props.id}_${choice}`;

  return (
    <label htmlFor={id} className="checkbox jf-checkbox" key={choice}>
      <input
        type="checkbox"
        name={props.name}
        id={id}
        value={choice}
        checked={props.value.indexOf(choice) !== -1}
        aria-invalid={ariaBool(!!props.errors)}
        disabled={props.isDisabled}
        onChange={(e) =>
          props.onChange(toggleChoice(choice, e.target.checked, props.value))
        }
      />{" "}
      <span className="jf-checkbox-symbol" />{" "}
      <span className="jf-label-text">{label}</span>
    </label>
  );
};

/** A JSX component that encapsulates a set of checkboxes. */
export function MultiCheckboxFormField(
  props: MultiChoiceFormFieldProps
): JSX.Element {
  let { ariaLabel, errorHelp } = formatErrors(props);

  return (
    <div className="field" role="group" aria-label={ariaLabel}>
      <label className="label" aria-hidden="true">
        {props.label}
      </label>
      <div className="control">
        {props.choices.map((choice) =>
          Array.isArray(choice) ? (
            <MultiCheckboxFormFieldCheckbox
              {...props}
              choice={choice}
              key={choice[0]}
            />
          ) : (
            choice
          )
        )}
      </div>
      {errorHelp}
    </div>
  );
}

export interface BooleanFormFieldProps extends BaseFormFieldProps<boolean> {
  children: any;
}

export type CheckboxViewProps = InputProps & {
  id: string;
  contentAfterLabel?: any;
  children: any;
};

export function CheckboxView(props: CheckboxViewProps) {
  const { children, contentAfterLabel, ...inputProps } = props;

  return (
    <div className="field">
      <label htmlFor={inputProps.id} className="checkbox jf-single-checkbox">
        <input type="checkbox" {...inputProps} />{" "}
        <span className="jf-checkbox-symbol" />{" "}
        <span className="jf-label-text">
          <span className="subtitle is-5">{props.children}</span>
        </span>
      </label>
      {contentAfterLabel}
    </div>
  );
}

export function CheckboxFormField(
  props: BooleanFormFieldProps & { extraContentAfterLabel?: JSX.Element }
): JSX.Element {
  const { errorHelp } = formatErrors(props);
  const contentAfterLabel = props.extraContentAfterLabel ? (
    <>
      {errorHelp}
      {props.extraContentAfterLabel}
    </>
  ) : (
    errorHelp
  );

  return (
    <CheckboxView
      name={props.name}
      id={props.id}
      checked={props.value}
      aria-invalid={ariaBool(!!props.errors)}
      disabled={props.isDisabled}
      onChange={(e) => props.onChange(e.target.checked)}
      contentAfterLabel={contentAfterLabel}
    >
      {props.children}
    </CheckboxView>
  );
}

export type HiddenFormFieldProps = Omit<
  BaseFormFieldProps<string | boolean | null | undefined>,
  "onChange"
>;

export function toHiddenFormFieldValue(
  value: string | boolean | null | undefined
): string | undefined {
  if (value === true) return "on";
  if (value === "") return "";
  return value || undefined;
}

export function HiddenFormField(props: HiddenFormFieldProps): JSX.Element {
  if (props.errors) {
    throw new Error(
      `Hidden fields should have no errors, but "${props.name}" does: ` +
        `${JSON.stringify(props.errors)}`
    );
  }
  return (
    <input
      type="hidden"
      name={props.name}
      value={toHiddenFormFieldValue(props.value)}
    />
  );
}

/**
 * Valid types of textual form field input.
 */
export type TextualInputType =
  | "text"
  | "password"
  | "date"
  | "tel"
  | "number"
  | "email";

/**
 * Properties for textual form field input.
 */
export interface TextualFormFieldProps extends BaseFormFieldProps<string> {
  type?: TextualInputType;
  autoFocus?: boolean;
  label: string;
  renderLabel?: LabelRenderer;
  required?: boolean;
  autoComplete?: string;
  help?: string | JSX.Element;
  min?: string | number | undefined;
  maxLength?: number | undefined;
  fieldProps?: DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >;
}

/**
 * A button to clear the value of a date field. This is needed primarily
 * to work around a bug in React+iOS whereby the built-in "clear" button
 * doesn't work, and (after about an hour of trying) is difficult or
 * impossible to make work properly. For more details, see:
 *
 * https://github.com/facebook/react/issues/8938#issuecomment-360573204
 */
function DateClear(props: TextualFormFieldProps): JSX.Element | null {
  if (props.value && !props.required) {
    return (
      <SimpleProgressiveEnhancement>
        <button
          type="button"
          className="button is-text is-small"
          onClick={() => props.onChange("")}
        >
          Clear
          <span className="jf-sr-only"> value for {props.label}</span>
        </button>
      </SimpleProgressiveEnhancement>
    );
  }

  return null;
}

/** A JSX component for textual form input. */
export function TextualFormField(props: TextualFormFieldProps): JSX.Element {
  const type: TextualInputType = props.type || "text";
  let { ariaLabel, errorHelp } = formatErrors(props);

  return (
    <div className="field" {...props.fieldProps}>
      {renderLabel(props.label, { htmlFor: props.id }, props.renderLabel)}
      <div className="control">
        <AutofocusedInput
          className={bulmaClasses("input", { "is-danger": !!props.errors })}
          disabled={props.isDisabled}
          aria-invalid={ariaBool(!!props.errors)}
          aria-label={ariaLabel}
          name={props.name}
          autoComplete={props.autoComplete}
          id={props.id}
          min={props.min}
          maxLength={props.maxLength}
          type={type}
          value={props.value}
          required={props.required}
          autoFocus={props.autoFocus}
          onChange={(e) => props.onChange(e.target.value)}
        />
        {type === "date" && <DateClear {...props} />}
      </div>
      {props.help && <p className="help">{props.help}</p>}
      {errorHelp}
    </div>
  );
}

/** A JSX component that encapsulates a <textarea>. */
export function TextareaFormField(props: TextualFormFieldProps): JSX.Element {
  let { ariaLabel, errorHelp } = formatErrors(props);
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useAutoFocus(ref, props.autoFocus);

  return (
    <div className="field" {...props.fieldProps}>
      {renderLabel(props.label, { htmlFor: props.id }, props.renderLabel)}
      <div className="control">
        <textarea
          ref={ref}
          className={bulmaClasses("textarea", { "is-danger": !!props.errors })}
          disabled={props.isDisabled}
          aria-invalid={ariaBool(!!props.errors)}
          aria-label={ariaLabel}
          name={props.name}
          rows={2}
          id={props.id}
          value={props.value}
          maxLength={props.maxLength}
          autoFocus={props.autoFocus}
          onChange={(e) => props.onChange(e.target.value)}
        />
      </div>
      {errorHelp}
    </div>
  );
}
