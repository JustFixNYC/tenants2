import React from 'react';
import autobind from 'autobind-decorator';
import { Redirect, Route, RouteComponentProps } from 'react-router';
import { LocationDescriptor } from 'history';
import { AriaAnnouncement } from './aria';
import { WithServerFormFieldErrors, getFormErrors, FormErrors, NonFieldErrors } from './form-errors';
import { BaseFormFieldProps } from './form-fields';
import { getAppStaticContext } from './app-static-context';
import { AppContext } from './app-context';


const CSRF_TOKEN_NAME = "csrfmiddlewaretoken";

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

type FormSubmitterPropsWithCtx<FormInput, FormOutput extends WithServerFormFieldErrors> =
  FormSubmitterProps<FormInput, FormOutput> & RouteComponentProps<any> & {
    csrfToken: string
  };

/** This class encapsulates common logic for form submission. */
export class FormSubmitterWithoutCtx<FormInput, FormOutput extends WithServerFormFieldErrors> extends React.Component<FormSubmitterPropsWithCtx<FormInput, FormOutput>, FormSubmitterState<FormInput>> {
  postedInitialState?: FormInput;

  constructor(props: FormSubmitterPropsWithCtx<FormInput, FormOutput>) {
    super(props);
    this.state = {
      isLoading: false,
      wasSuccessfullySubmitted: false
    };
    const staticContext = getAppStaticContext(this.props);
    if (staticContext && staticContext.method === 'POST') {
      if (staticContext.postBody) {
        const input = {} as FormInput;
        for (let key in props.initialState) {
          input[key] = staticContext.postBody[key];
        }
        this.postedInitialState = input;
        staticContext.wasPostHandled = true;

        const mapKey = JSON.stringify(input);
        const mapValue = staticContext.promiseMap.get(mapKey);

        if (mapValue) {
          if (mapValue.result) {
            this.handleFormOutput(mapValue.result);
          }
          return;
        } else {
          staticContext.promiseMap.set(mapKey, { promise: props.onSubmit(input) });
        }
      }
    }
  }

  updateState(state: FormSubmitterState<FormInput>) {
    const staticContext = getAppStaticContext(this.props);

    if (staticContext) {
      this.state = state;
    } else {
      this.setState(state);
    }
  }

  @autobind
  handleFormOutput(output: FormOutput) {
    if (output.errors.length) {
      this.updateState({
        isLoading: false,
        errors: getFormErrors<FormInput>(output.errors),
        wasSuccessfullySubmitted: false
      });
    } else {
      this.updateState({
        isLoading: false,
        errors: undefined,
        wasSuccessfullySubmitted: true
      });
      this.props.onSuccess(output);
    }
  }

  @autobind
  handleSubmit(input: FormInput) {
    this.setState({
      isLoading: true,
      errors: undefined,
      wasSuccessfullySubmitted: false
    });
    return this.props.onSubmit(input).then(this.handleFormOutput).catch(e => {
      this.setState({ isLoading: false });
    });
  }

  render() {
    if (this.state.wasSuccessfullySubmitted && this.props.onSuccessRedirect) {
      return <Redirect push to={this.props.onSuccessRedirect} />;
    }
    return (
      <Form isLoading={this.state.isLoading} errors={this.state.errors} initialState={this.postedInitialState || this.props.initialState} onSubmit={this.handleSubmit} csrfToken={this.props.csrfToken}>
        {this.props.children}
      </Form>
    );
  }
}

export function FormSubmitter<FormInput, FormOutput extends WithServerFormFieldErrors>(props: FormSubmitterProps<FormInput, FormOutput>): JSX.Element {
  return (
    <AppContext.Consumer>
      {(appCtx) => (
        <Route render={(routerProps) => (
          <FormSubmitterWithoutCtx {...routerProps} {...props} csrfToken={appCtx.session.csrfToken} />
        )} />
      )}
    </AppContext.Consumer>
  );
}

export interface BaseFormProps<FormInput> {
  isLoading: boolean;
  errors?: FormErrors<FormInput>;
}

export interface FormProps<FormInput> extends BaseFormProps<FormInput> {
  onSubmit: (input: FormInput) => void;
  initialState: FormInput;
  children: (context: FormContext<FormInput>) => JSX.Element;
  csrfToken?: string;
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
      <form onSubmit={this.handleSubmit} method={this.props.csrfToken ? "POST" : "GET"}>
        {this.props.csrfToken && <input type="hidden" name={CSRF_TOKEN_NAME} value={this.props.csrfToken} />}
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
