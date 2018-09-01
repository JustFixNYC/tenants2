import React from 'react';
import autobind from 'autobind-decorator';
import { Redirect } from 'react-router';
import { LocationDescriptor } from 'history';
import { AriaAnnouncement } from './aria';
import { WithServerFormFieldErrors, getFormErrors, FormErrors, NonFieldErrors } from './form-errors';
import { BaseFormFieldProps } from './form-fields';


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
