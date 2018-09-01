import React from 'react';
import autobind from 'autobind-decorator';
import { Redirect } from 'react-router';
import { LocationDescriptor } from 'history';
import { AriaAnnouncement, ariaBool } from './aria';
import { DjangoChoices } from './common-data';
import { bulmaClasses } from './bulma';
import { formatErrors, WithServerFormFieldErrors, getFormErrors, FormErrors, NonFieldErrors } from './form-errors';


/**
 * Base properties that form fields need to have.
 */
export interface BaseFormFieldProps<T> {
  /** Event handler to call when the field's value changes. */
  onChange: (value: T) => void;

  /** List of validation errors, if any, for the field. */
  errors?: string[];

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
export type TextualInputType = 'text'|'password';

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

interface FormSubmitterProps<FormInput, FormOutput extends WithServerFormFieldErrors> {
  onSubmit: (input: FormInput) => Promise<FormOutput>;
  onSuccess: (output: FormOutput) => void;
  onSuccessRedirect?: LocationDescriptor;
  initialState: FormInput;
  children: (context: FormContext<FormInput>) => JSX.Element;
}

type FormSubmitterState<FormInput> = BaseFormProps<FormInput> & {
  wasSuccessfullySubmitted: boolean
};

/** This class encapsulates common logic for form submission. */
export class FormSubmitter<FormInput, FormOutput extends WithServerFormFieldErrors> extends React.Component<FormSubmitterProps<FormInput, FormOutput>, FormSubmitterState<FormInput>> {
  constructor(props: FormSubmitterProps<FormInput, FormOutput>) {
    super(props);
    this.state = {
      isLoading: false,
      wasSuccessfullySubmitted: false
    };
  }

  @autobind
  handleSubmit(input: FormInput) {
    this.setState({
      isLoading: true,
      errors: undefined,
      wasSuccessfullySubmitted: false
    });
    return this.props.onSubmit(input).then(output => {
      if (output.errors.length) {
        this.setState({
          isLoading: false,
          errors: getFormErrors<FormInput>(output.errors)
        });
      } else {
        this.setState({
          isLoading: false,
          wasSuccessfullySubmitted: true
        });
        this.props.onSuccess(output);
      }
    }).catch(e => {
      this.setState({ isLoading: false });
    });
  }

  render() {
    if (this.state.wasSuccessfullySubmitted && this.props.onSuccessRedirect) {
      return <Redirect push to={this.props.onSuccessRedirect} />;
    }
    return (
      <Form isLoading={this.state.isLoading} errors={this.state.errors} initialState={this.props.initialState} onSubmit={this.handleSubmit}>
        {this.props.children}
      </Form>
    );
  }
}

export interface BaseFormProps<FormInput> {
  isLoading: boolean;
  errors?: FormErrors<FormInput>;
}

export interface FormProps<FormInput> extends BaseFormProps<FormInput> {
  onSubmit: (input: FormInput) => void;
  initialState: FormInput;
  children: (context: FormContext<FormInput>) => JSX.Element;
}

export interface FormContext<FormInput> extends FormProps<FormInput> {
  fieldPropsFor: <K extends (keyof FormInput) & string>(field: K) => BaseFormFieldProps<FormInput[K]>;
}

/** This class encapsulates view logic for forms. */
export class Form<FormInput> extends React.Component<FormProps<FormInput>, FormInput> {
  constructor(props: FormProps<FormInput>) {
    super(props);
    this.state = props.initialState;
  }

  @autobind
  handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!this.props.isLoading) {
      this.props.onSubmit(this.state);
    }
  }

  @autobind
  fieldPropsFor<K extends (keyof FormInput) & string>(field: K): BaseFormFieldProps<FormInput[K]>  {
    return {
      onChange: (value) => {
        // I'm not sure why Typescript dislikes this, but it seems
        // like the only way to get around it is to cast to "any". :(
        this.setState({ [field]: value } as any);
      },
      errors: this.props.errors && this.props.errors.fieldErrors[field],
      value: this.state[field],
      name: field,
      isDisabled: this.props.isLoading
    };
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        {this.props.isLoading && <AriaAnnouncement text="Loading..." />}
        {this.props.errors && <AriaAnnouncement text="Your form submission had errors." />}
        <NonFieldErrors errors={this.props.errors} />
        {this.props.children({
          ...this.props,
          fieldPropsFor: this.fieldPropsFor
        })}
      </form>
    );
  }
}
