import React from "react";
import {
  WithServerFormFieldErrors,
  FormErrors,
  trackFormErrors,
  getFormErrors,
} from "./form-errors";
import { BaseFormProps, Form, FormProps } from "./form";
import { RouteComponentProps, Route } from "react-router";
import { Redirector, performSoftRedirect } from "../browser-redirect";
import autobind from "autobind-decorator";
import { areFieldsEqual } from "./form-field-equality";
import { ga } from "../analytics/google-analytics";
import { HistoryBlocker } from "./history-blocker";
import { getDataLayer } from "../analytics/google-tag-manager";
import { getAmplitude, logAmplitudeFormSubmission } from "../analytics/amplitude";

export type FormSubmitterProps<
  FormInput,
  FormOutput extends WithServerFormFieldErrors
> = {
  /**
   * This function is called when the user submits the form; it
   * is responsible for communicating with a server and returning the
   * result of the form submission.
   */
  onSubmit: (input: FormInput) => Promise<FormOutput>;

  /**
   * This function is called when a server returns a response to
   * form submission that has no validation errors.
   *
   * Note that this function is *only* called on the client-side
   * in progressively-enhanced scenarios, so it should only be
   * used to do things that aren't mission-critical, e.g. pinging
   * an analytics service.
   */
  onSuccess?: (output: FormOutput) => void;

  /**
   * This prop is used to determine where to send the user when
   * the form is submitted without any errors. It can either be
   * a URL path, or a function that returns one.
   */
  onSuccessRedirect?:
    | string
    | ((output: FormOutput, input: FormInput) => string);

  /**
   * This function is used to actually perform the browser redirect
   * made on successful form submission.
   */
  performRedirect?: Redirector;

  /**
   * This specifies whether to ask the user if they're sure they
   * want to navigate away from the page if the form has unsaved
   * data in it.
   */
  confirmNavIfChanged?: boolean;

  /**
   * This is a unique identifier given to the form, useful to
   * distinguish the form from others that may exist on the same
   * page.
   *
   * If provided, the identifier is sent to analytics services
   * when form events occur, to help disambiguate it from events
   * on other forms in the same page.
   */
  formId?: string;

  /**
   * A name for the kind of form this represents; for instance, if this form
   * triggers a GraphQL mutation, it could be the name of the mutation.
   *
   * If non-empty, this value is sent to analytics services.
   */
  formKind?: string;

  /**
   * Any validation errors to show upon initial display of the form.
   * Note that this should either be undefined or an array containing
   * at least one element; it should *never* be an empty array.
   */
  initialErrors?: FormErrors<FormInput>;

  /**
   * The latest server response to the most recent form submission,
   * if any. This can be used by the form's children to e.g.
   * show a success message upon initial display of the form.
   */
  initialLatestOutput?: FormOutput;

  /**
   * Whether to automatically submit the form as soon as the
   * component is mounted. This can be useful for HTTP GET-based
   * forms that don't have cached/pre-fetched results available.
   */
  submitOnMount?: boolean;
} & Pick<
  FormProps<FormInput, FormOutput>,
  | "idPrefix"
  | "initialState"
  | "children"
  | "extraFields"
  | "extraFormAttributes"
  | "updateInitialStateInBrowser"
>;

/**
 * This class encapsulates common logic for form submission. It's
 * responsible for:
 *
 *   * Redirecting users to other pages upon successful form submission.
 *
 *   * Potentially prompting users if they are about to leave the page
 *     while the form has unsaved data in it.
 *
 *   * Communicating the success/failure of form submission to analytics
 *     services.
 */
export class FormSubmitter<
  FormInput,
  FormOutput extends WithServerFormFieldErrors
> extends React.Component<FormSubmitterProps<FormInput, FormOutput>> {
  render() {
    return (
      <Route
        render={(ctx) => (
          <FormSubmitterWithoutRouter {...this.props} {...ctx} />
        )}
      />
    );
  }
}

export type FormSubmitterPropsWithRouter<
  FormInput,
  FormOutput extends WithServerFormFieldErrors
> = FormSubmitterProps<FormInput, FormOutput> & RouteComponentProps<any>;

interface FormSubmitterState<FormInput, FormOutput>
  extends BaseFormProps<FormInput> {
  isDirty: boolean;
  wasSubmittedSuccessfully: boolean;
  currentSubmissionId: number;
  initialInput: FormInput;
  latestOutput?: FormOutput;
  lastSuccessRedirect?: {
    from: string;
    to: string;
  };
}

export function getSuccessRedirect<
  FormInput,
  FormOutput extends WithServerFormFieldErrors
>(
  props: FormSubmitterPropsWithRouter<FormInput, FormOutput>,
  input: FormInput,
  output: FormOutput
): string | null {
  const { onSuccessRedirect } = props;
  if (onSuccessRedirect) {
    return typeof onSuccessRedirect === "function"
      ? onSuccessRedirect(output, input)
      : onSuccessRedirect;
  }
  return null;
}

export class FormSubmitterWithoutRouter<
  FormInput,
  FormOutput extends WithServerFormFieldErrors
> extends React.Component<
  FormSubmitterPropsWithRouter<FormInput, FormOutput>,
  FormSubmitterState<FormInput, FormOutput>
> {
  willUnmount = false;

  constructor(props: FormSubmitterPropsWithRouter<FormInput, FormOutput>) {
    super(props);
    this.state = {
      isLoading: false,
      errors: props.initialErrors,
      initialInput: props.initialState,
      latestOutput: this.props.initialLatestOutput,
      currentSubmissionId: 0,
      isDirty: false,
      wasSubmittedSuccessfully: false,
    };
  }

  @autobind
  handleChange(input: FormInput) {
    const isDirty = !areFieldsEqual(this.props.initialState, input);
    this.setState({ isDirty });
  }

  @autobind
  handleUpdateInitialState(initialInput: FormInput) {
    this.setState({ initialInput });
  }

  @autobind
  handleSubmit(input: FormInput) {
    const submissionId = this.state.currentSubmissionId + 1;
    this.setState({
      isLoading: true,
      errors: undefined,
      currentSubmissionId: submissionId,
      wasSubmittedSuccessfully: false,
      latestOutput: undefined,
    });
    return this.props
      .onSubmit(input)
      .then((output) => {
        if (this.willUnmount) return;
        if (this.state.currentSubmissionId !== submissionId) return;
        if (output.errors.length) {
          trackFormErrors(output.errors);
          if (this.props.formKind) {
            logAmplitudeFormSubmission({
              pathname: this.props.location.pathname,
              formKind: this.props.formKind,
              formId: this.props.formId,
              errors: output.errors
            });
          }
          this.setState({
            isLoading: false,
            latestOutput: output,
            errors: getFormErrors<FormInput>(output.errors),
          });
        } else {
          this.setState({
            wasSubmittedSuccessfully: true,
            latestOutput: output,
          });
          if (this.props.onSuccess) {
            this.props.onSuccess(output);
          }

          // It's actually possible our onSuccess() callback may have caused a state
          // change elsewhere in the app that unmounted us; if that's the case, abort!
          if (this.willUnmount) return;

          const redirect = getSuccessRedirect(this.props, input, output);
          if (redirect) {
            const performRedirect =
              this.props.performRedirect || performSoftRedirect;
            this.setState({
              lastSuccessRedirect: {
                from: this.props.location.pathname,
                to: redirect,
              },
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
          ga(
            "send",
            "event",
            "form-success",
            this.props.formId || this.props.formKind || "default",
            redirect || undefined
          );
          if (this.props.formKind) {
            logAmplitudeFormSubmission({
              pathname: this.props.location.pathname,
              formKind: this.props.formKind,
              formId: this.props.formId,
              redirect: redirect
            });
            getDataLayer().push({
              event: "jf.formSuccess",
              "jf.formKind": this.props.formKind,
              "jf.formId": this.props.formId,
              "jf.redirect": redirect || undefined,
            });
          }
        }
      })
      .catch((e) => {
        this.setState({ isLoading: false });
      });
  }

  componentDidMount() {
    if (this.props.submitOnMount) {
      this.handleSubmit(this.props.initialState);
    }
  }

  componentWillUnmount() {
    this.willUnmount = true;
  }

  componentDidUpdate(
    prevProps: FormSubmitterPropsWithRouter<FormInput, FormOutput>
  ) {
    const { lastSuccessRedirect } = this.state;
    if (
      lastSuccessRedirect &&
      prevProps.location.pathname === lastSuccessRedirect.to &&
      this.props.location.pathname === lastSuccessRedirect.from
    ) {
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
        wasSubmittedSuccessfully: false,
      });
    }
  }

  get shouldBlockHistory(): boolean {
    return this.state.isDirty && !this.state.wasSubmittedSuccessfully;
  }

  render() {
    return (
      <>
        {this.shouldBlockHistory && (
          <HistoryBlocker reportOnly={!this.props.confirmNavIfChanged} />
        )}
        <Form
          isLoading={this.state.isLoading}
          errors={this.state.errors}
          initialState={this.props.initialState}
          updateInitialStateInBrowser={this.props.updateInitialStateInBrowser}
          onUpdateInitialState={this.handleUpdateInitialState}
          onSubmit={this.handleSubmit}
          onChange={this.handleChange}
          idPrefix={this.props.idPrefix}
          extraFields={this.props.extraFields}
          extraFormAttributes={this.props.extraFormAttributes}
          latestOutput={this.state.latestOutput}
        >
          {this.props.children}
        </Form>
      </>
    );
  }
}
