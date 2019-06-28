import React from 'react';
import { WithServerFormFieldErrors, FormErrors, trackFormErrors, getFormErrors } from './form-errors';
import { FormContextRenderer, HTMLFormAttrs, BaseFormProps, Form } from './form';
import { RouteComponentProps, Route } from 'react-router';
import { History } from 'history';
import autobind from 'autobind-decorator';
import { areFieldsEqual } from './form-field-equality';
import { ga } from './google-analytics';
import { HistoryBlocker } from './history-blocker';

export interface FormSubmitterProps<FormInput, FormOutput extends WithServerFormFieldErrors> {
  onSubmit: (input: FormInput) => Promise<FormOutput>;
  onSuccess?: (output: FormOutput) => void;
  onSuccessRedirect?: string|((output: FormOutput, input: FormInput) => string);
  performRedirect?: (redirect: string, history: History) => void;
  confirmNavIfChanged?: boolean;
  formId?: string;
  idPrefix?: string;
  initialState: FormInput;
  initialErrors?: FormErrors<FormInput>;
  children: FormContextRenderer<FormInput>;
  extraFields?: JSX.Element;
  extraFormAttributes?: HTMLFormAttrs;
}

export type FormSubmitterPropsWithRouter<FormInput, FormOutput extends WithServerFormFieldErrors> = FormSubmitterProps<FormInput, FormOutput> & RouteComponentProps<any>;

interface FormSubmitterState<FormInput> extends BaseFormProps<FormInput> {
  isDirty: boolean;
  wasSubmittedSuccessfully: boolean;
  lastSuccessRedirect?: {
    from: string,
    to: string
  }
}

export function getSuccessRedirect<FormInput, FormOutput extends WithServerFormFieldErrors>(
  props: FormSubmitterPropsWithRouter<FormInput, FormOutput>,
  input: FormInput,
  output: FormOutput
): string|null {
  const { onSuccessRedirect } = props;
  if (onSuccessRedirect) {
    return typeof(onSuccessRedirect) === 'function'
      ? onSuccessRedirect(output, input)
      : onSuccessRedirect;
  }
  return null;
}

export function defaultPerformRedirect(redirect: string, history: History) {
  history.push(redirect);
}

/** This class encapsulates common logic for form submission. */
export class FormSubmitterWithoutRouter<FormInput, FormOutput extends WithServerFormFieldErrors> extends React.Component<FormSubmitterPropsWithRouter<FormInput, FormOutput>, FormSubmitterState<FormInput>> {
  willUnmount = false;

  constructor(props: FormSubmitterPropsWithRouter<FormInput, FormOutput>) {
    super(props);
    this.state = {
      isLoading: false,
      errors: props.initialErrors,
      isDirty: false,
      wasSubmittedSuccessfully: false
    };
  }

  @autobind
  handleChange(input: FormInput) {
    const isDirty = !areFieldsEqual(this.props.initialState, input);
    this.setState({ isDirty });
  }

  @autobind
  handleSubmit(input: FormInput) {
    this.setState({
      isLoading: true,
      errors: undefined,
      wasSubmittedSuccessfully: false
    });
    return this.props.onSubmit(input).then(output => {
      if (this.willUnmount) return;
      if (output.errors.length) {
        trackFormErrors(output.errors);
        this.setState({
          isLoading: false,
          errors: getFormErrors<FormInput>(output.errors)
        });
      } else {
        this.setState({
          wasSubmittedSuccessfully: true
        });
        if (this.props.onSuccess) {
          this.props.onSuccess(output);
        }

        // It's actually possible our onSuccess() callback may have caused a state
        // change elsewhere in the app that unmounted us; if that's the case, abort!
        if (this.willUnmount) return;

        const redirect = getSuccessRedirect(this.props, input, output);
        if (redirect) {
          const performRedirect = this.props.performRedirect || defaultPerformRedirect;
          this.setState({
            lastSuccessRedirect: {
              from: this.props.location.pathname,
              to: redirect
            }
          });
          performRedirect(redirect, this.props.history);
        } else {
          // Note that we only set isLoading back to false if we *don't* redirect.
          // This is so that our user doesn't accidentally see
          // the page appearing to no longer be in a loading state, while still
          // having not moved on to the next page. It is especially useful in the
          // case of e.g. transition animations.
          this.setState({ isLoading: false });
        }
        ga('send', 'event', 'form-success',
           this.props.formId || 'default', redirect || undefined);
      }
    }).catch(e => {
      this.setState({ isLoading: false });
    });
  }

  componentWillUnmount() {
    this.willUnmount = true;
  }

  componentDidUpdate(
    prevProps: FormSubmitterPropsWithRouter<FormInput, FormOutput>
  ) {
    const { lastSuccessRedirect } = this.state;
    if (lastSuccessRedirect &&
        prevProps.location.pathname === lastSuccessRedirect.to &&
        this.props.location.pathname === lastSuccessRedirect.from) {
      // We were just sent back from the place we successfully
      // redirected to earlier (likely a modal, since we apparently
      // weren't unmounted) back to the original page our form was
      // on. This is possibly because the user was shown some kind
      // of confirmation modal and decided to come back to the form
      // to make some changes; let's make sure they can actually
      // edit the form.
      this.setState({
        lastSuccessRedirect: undefined,
        isLoading: false,
        wasSubmittedSuccessfully: false
      });
    }
  }

  get shouldBlockHistory(): boolean {
    return this.state.isDirty && !this.state.wasSubmittedSuccessfully;
  }

  render() {
    return <>
      {this.shouldBlockHistory && <HistoryBlocker reportOnly={!this.props.confirmNavIfChanged} />}
      <Form
        isLoading={this.state.isLoading}
        errors={this.state.errors}
        initialState={this.props.initialState}
        onSubmit={this.handleSubmit}
        onChange={this.handleChange}
        idPrefix={this.props.idPrefix}
        extraFields={this.props.extraFields}
        extraFormAttributes={this.props.extraFormAttributes}
      >
        {this.props.children}
      </Form>
    </>
  }
}

export class FormSubmitter<FormInput, FormOutput extends WithServerFormFieldErrors> extends React.Component<FormSubmitterProps<FormInput, FormOutput>> {
  render() {
    return (
      <Route render={(ctx) => (
        <FormSubmitterWithoutRouter {...this.props} {...ctx} />
      )} />
    );
  }
}
