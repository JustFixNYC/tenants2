import React from 'react';
import autobind from 'autobind-decorator';
import { RouteComponentProps, Route } from 'react-router';
import { AriaAnnouncement } from './aria';
import { WithServerFormFieldErrors, getFormErrors, FormErrors, NonFieldErrors } from './form-errors';
import { BaseFormFieldProps } from './form-fields';
import { AppContext } from './app-context';


interface FormSubmitterProps<FormInput, FormOutput extends WithServerFormFieldErrors> {
  onSubmit: (input: FormInput) => Promise<FormOutput>;
  onSuccess?: (output: FormOutput) => void;
  onSuccessRedirect?: string|((output: FormOutput, input: FormInput) => string);
  initialState: FormInput;
  initialErrors?: FormErrors<FormInput>;
  children: (context: FormContext<FormInput>) => JSX.Element;
}

type FormSubmitterPropsWithRouter<FormInput, FormOutput extends WithServerFormFieldErrors> = FormSubmitterProps<FormInput, FormOutput> & RouteComponentProps<any>;

type FormSubmitterState<FormInput> = BaseFormProps<FormInput>;

/**
 * This component wraps a form and modifies its initial state with any information
 * passed from the server as a result of a legacy browser POST.
 */
function LegacyFormSubmissionWrapper<FormInput, FormOutput extends WithServerFormFieldErrors>(
  props: FormSubmitterPropsWithRouter<FormInput, FormOutput>
) {
  return (
    <AppContext.Consumer>
      {(appCtx) => {
        let newProps = props;
        if (appCtx.legacyFormSubmission) {
          const initialState: FormInput = appCtx.legacyFormSubmission.input;
          const output: FormOutput = appCtx.legacyFormSubmission.result;
          const initialErrors = output.errors.length ? getFormErrors<FormInput>(output.errors) : undefined;
          newProps = {
            ...props,
            initialState,
            initialErrors
          };
          // TODO: Handle the case where there were no errors and we need to redirect.
        }
        return <FormSubmitterWithoutRouter {...newProps} />;
      }}
    </AppContext.Consumer>
  );
}

/** This class encapsulates common logic for form submission. */
export class FormSubmitterWithoutRouter<FormInput, FormOutput extends WithServerFormFieldErrors> extends React.Component<FormSubmitterPropsWithRouter<FormInput, FormOutput>, FormSubmitterState<FormInput>> {
  constructor(props: FormSubmitterPropsWithRouter<FormInput, FormOutput>) {
    super(props);
    this.state = {
      isLoading: false,
      errors: props.initialErrors
    };
  }

  @autobind
  handleSubmit(input: FormInput) {
    this.setState({
      isLoading: true,
      errors: undefined
    });
    return this.props.onSubmit(input).then(output => {
      if (output.errors.length) {
        this.setState({
          isLoading: false,
          errors: getFormErrors<FormInput>(output.errors)
        });
      } else {
        this.setState({
          isLoading: false
        });
        const { onSuccessRedirect } = this.props;
        if (onSuccessRedirect) {
          let redirect = typeof(onSuccessRedirect) === 'function'
            ? onSuccessRedirect(output, input)
            : onSuccessRedirect;
          this.props.history.push(redirect);
        }
        if (this.props.onSuccess) {
          this.props.onSuccess(output);
        }
      }
    }).catch(e => {
      this.setState({ isLoading: false });
    });
  }

  render() {
    return (
      <Form
        isLoading={this.state.isLoading}
        errors={this.state.errors}
        initialState={this.props.initialState}
        onSubmit={this.handleSubmit}
      >
        {this.props.children}
      </Form>
    );
  }
}

export class FormSubmitter<FormInput, FormOutput extends WithServerFormFieldErrors> extends React.Component<FormSubmitterProps<FormInput, FormOutput>> {
  render() {
    return (
      <Route render={(ctx) => (
        <LegacyFormSubmissionWrapper {...this.props} {...ctx} />
      )} />
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
