import React from 'react';
import classnames from 'classnames';
import autobind from 'autobind-decorator';
import { Redirect } from 'react-router';
import { LocationDescriptor } from 'history';

/**
 * This is the form validation error type returned from the server.
 */
export interface FormFieldError {
  field: string;
  messages: string[];
}

// This type is parameterized by the form input, so that each
// key corresponds to the name of a form input field.
export type FormFieldErrorMap<T> = {
  [K in keyof T]?: string[];
}

export interface FormErrors<T> {
  /**
   * Non-field errors that don't correspond to any particular field.
   */
  nonFieldErrors: string[];

  /**
   * Field-specific errors.
   */
  fieldErrors: FormFieldErrorMap<T>;
}

/**
 * Re-structure a list of errors from the server into a more convenient
 * format for us to process.
 * 
 * @param errors A list of errors from the server.
 */
export function getFormErrors<T>(errors: FormFieldError[]): FormErrors<T> {
  const result: FormErrors<T> = {
    nonFieldErrors: [],
    fieldErrors: {}
  };

  errors.forEach(error => {
    if (error.field === '__all__') {
      result.nonFieldErrors.push(...error.messages);
    } else {
      // Note that we're forcing a typecast here. It's not ideal, but
      // it seems better than the alternative of not parameterizing
      // this type at all.
      const field: keyof T = error.field as any;

      // This code looks weird because TypeScript is being fidgety.
      const arr = result.fieldErrors[field];
      if (arr) {
        arr.push(...error.messages);
      } else {
        result.fieldErrors[field] = [...error.messages];
      }
    }
  });

  return result;
}

/** A JSX component that displays non-field errors. */
export function NonFieldErrors(props: { errors?: FormErrors<any> }): JSX.Element|null {
  const errors = props.errors && props.errors.nonFieldErrors;

  if (!errors) {
    return null;
  }

  return (
    <React.Fragment>
      {errors.map(error => <div className="notification is-danger" key={error}>{error}</div>)}
    </React.Fragment>
  );
}

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

  // TODO: Assign an id to the input and make the label point to it.
  return (
    <div className="field">
      <label className="label">{props.label}</label>
      <div className="control">
        <input
          className={classnames('input', {
            'is-danger': !!props.errors
          })}
          disabled={props.isDisabled}
          aria-label={props.label}
          name={props.name}
          type={type}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        />
      </div>
      {props.errors
        ? <p className="help is-danger">{props.errors.join(' ')}</p>
        : null}
    </div>
  );
}

/**
 * Any form validation done by the server will return an object that
 * looks like this.
 */
type WithFieldErrors = {
  errors: FormFieldError[];
};

interface FormSubmitterProps<FormInput, FormOutput extends WithFieldErrors> {
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
export class FormSubmitter<FormInput, FormOutput extends WithFieldErrors> extends React.Component<FormSubmitterProps<FormInput, FormOutput>, FormSubmitterState<FormInput>> {
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
        <NonFieldErrors errors={this.props.errors} />
        {this.props.children({
          ...this.props,
          fieldPropsFor: this.fieldPropsFor
        })}
      </form>
    );
  }
}
