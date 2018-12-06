import React, { FormHTMLAttributes } from 'react';
import autobind from 'autobind-decorator';
import { RouteComponentProps, Route } from 'react-router';
import { AriaAnnouncement } from './aria';
import { WithServerFormFieldErrors, FormErrors, NonFieldErrors, trackFormErrors, FormlikeErrors, areServerFormErrorsEmpty, getFormlikeErrors, isFormsetErrors, FormsetErrors, NonFormErrors } from './form-errors';
import { BaseFormFieldProps } from './form-fields';
import { AppContext, AppLegacyFormSubmission } from './app-context';
import { Omit, assertNotNull } from './util';
import { FetchMutationInfo, createMutationSubmitHandler } from './forms-graphql';
import { AllSessionInfo } from './queries/AllSessionInfo';
import { getAppStaticContext } from './app-static-context';
import { History } from 'history';
import { HistoryBlocker } from './history-blocker';
import { areFieldsEqual } from './form-field-equality';
import { ga } from './google-analytics';

type HTMLFormAttrs = React.DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;
type Unarrayed<T> = T extends (infer U)[] ? U : never;

export type FormContextRenderer<FormInput> = (context: FormContext<FormInput>) => JSX.Element;

interface FormSubmitterProps<FormInput, FormOutput extends WithServerFormFieldErrors> {
  onSubmit: (input: FormInput) => Promise<FormOutput>;
  onSuccess?: (output: FormOutput) => void;
  onSuccessRedirect?: string|((output: FormOutput, input: FormInput) => string);
  performRedirect?: (redirect: string, history: History) => void;
  confirmNavIfChanged?: boolean;
  formId?: string;
  idPrefix?: string;
  initialState: FormInput;
  initialErrors?: FormlikeErrors<FormInput>;
  children: FormContextRenderer<FormInput>;
  extraFields?: JSX.Element;
  extraFormAttributes?: HTMLFormAttrs;
}

type FormSubmitterPropsWithRouter<FormInput, FormOutput extends WithServerFormFieldErrors> = FormSubmitterProps<FormInput, FormOutput> & RouteComponentProps<any>;

interface FormSubmitterState<FormInput> extends BaseFormProps<FormInput> {
  isDirty: boolean;
  wasSubmittedSuccessfully: boolean;
}

/**
 * This component wraps a form and modifies its initial state with any information
 * passed from the server as a result of a legacy browser POST.
 */
function LegacyFormSubmissionWrapper<FormInput, FormOutput extends WithServerFormFieldErrors>(
  props: FormSubmitterPropsWithRouter<FormInput, FormOutput> & {
    isSubmissionOurs: (submission: AppLegacyFormSubmission) => boolean;
  }
) {
  return (
    <AppContext.Consumer>
      {(appCtx) => {
        const { isSubmissionOurs, ...otherProps } = props;
        let newProps: FormSubmitterPropsWithRouter<FormInput, FormOutput> = {
          ...otherProps,
          extraFields: (
            <React.Fragment>
              <input type="hidden" name="csrfmiddlewaretoken" value={appCtx.session.csrfToken} />
              {props.extraFields}
            </React.Fragment>
          ),
          extraFormAttributes: {
            ...props.extraFormAttributes,
            method: 'POST',
            action: props.location.pathname
          }
        };
        /* istanbul ignore next: this is tested by integration tests. */
        if (appCtx.legacyFormSubmission && isSubmissionOurs(appCtx.legacyFormSubmission)) {
          const initialState: FormInput = appCtx.legacyFormSubmission.input;
          const output: FormOutput = appCtx.legacyFormSubmission.result;
          const isErrorFree = areServerFormErrorsEmpty(output);
          const initialErrors = isErrorFree ? undefined : getFormlikeErrors<FormInput>(output);
          newProps = {
            ...newProps,
            initialState,
            initialErrors
          };
          if (isErrorFree) {
            const redirect = getSuccessRedirect(newProps, initialState, output);
            if (redirect) {
              const appStaticCtx = assertNotNull(getAppStaticContext(props));
              appStaticCtx.url = redirect;
              return null;
            }
            // TODO: If we're still here, that means the form submission was successful.
            // When processing forms on the client-side, we'd call the form's onSuccess
            // handler here, but we don't want to do that here because it would likely
            // result in a component state change, and our components are stateless
            // during server-side rendering. So I'm not really sure what to do here.
          }
        }
        return <FormSubmitterWithoutRouter {...newProps} />;
      }}
    </AppContext.Consumer>
  );
}

function getSuccessRedirect<FormInput, FormOutput extends WithServerFormFieldErrors>(
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
      if (!areServerFormErrorsEmpty(output)) {
        if (Array.isArray(output.errors)) {
          trackFormErrors(output.errors);
          // TODO: Also track errors for formset errors.
        }
        this.setState({
          isLoading: false,
          errors: getFormlikeErrors<FormInput>(output)
        });
      } else {
        this.setState({
          wasSubmittedSuccessfully: true
        });
        if (this.props.onSuccess) {
          this.props.onSuccess(output);
        }
        const redirect = getSuccessRedirect(this.props, input, output);
        if (redirect) {
          const performRedirect = this.props.performRedirect || defaultPerformRedirect;
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

interface SessionUpdatingFormOutput extends WithServerFormFieldErrors {
  session: Partial<AllSessionInfo>|null;
}

type stateFromSessionFn<FormInput> = ((session: AllSessionInfo) => FormInput);

type SessionUpdatingFormSubmitterProps<FormInput, FormOutput extends SessionUpdatingFormOutput> = Omit<LegacyFormSubmitterProps<FormInput, FormOutput>, 'initialState'> & {
  initialState: stateFromSessionFn<FormInput>|FormInput;
};

/**
 * This form submitter supports a very common use case in which the GraphQL mutation,
 * when successful, simply returns a 'session' key that contains updates to the
 * session state.
 */
export class SessionUpdatingFormSubmitter<FormInput, FormOutput extends SessionUpdatingFormOutput> extends React.Component<SessionUpdatingFormSubmitterProps<FormInput, FormOutput>> {
  render() {
    return (
      <AppContext.Consumer>
        {(appCtx) => {
          let initialState = (typeof(this.props.initialState) === 'function')
            // TypeScript 3.1 introduced an extremely confusing breaking change with
            // opaque intentions [1] that broke our type narrowing, and after about an
            // hour of trying I'm giving up and forcing a typecast. This might be easier
            // if Typescript actually had a JSON type [2], since that's essentially what
            // FormInput is, but otherwise I have no idea how to narrow FormInput in
            // such a way that our conditional would result in a type narrowing instead
            // of TypeScript 3.1's bizarre new behavior.
            //
            // [1] https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#narrowing-functions-now-intersects--object-and-unconstrained-generic-type-parameters
            // [2] https://github.com/Microsoft/TypeScript/issues/1897
            ? (this.props.initialState as stateFromSessionFn<FormInput>)(appCtx.session)
            : this.props.initialState;
          return <LegacyFormSubmitter
            {...this.props}
            initialState={initialState}
            onSuccess={(output) => {
              appCtx.updateSession(assertNotNull(output.session));
              if (this.props.onSuccess) {
                this.props.onSuccess(output);
              }
            }}
          />;
        }}
      </AppContext.Consumer>
    );
  }
}

type LegacyFormSubmitterProps<FormInput, FormOutput extends WithServerFormFieldErrors> = Omit<FormSubmitterProps<FormInput, FormOutput>, 'onSubmit'> & {
  mutation: FetchMutationInfo<FormInput, FormOutput>
};

/** A form submitter that supports submission via legacy browser POST. */
export class LegacyFormSubmitter<FormInput, FormOutput extends WithServerFormFieldErrors> extends React.Component<LegacyFormSubmitterProps<FormInput, FormOutput>> {
  render() {
    return (
      <AppContext.Consumer>
        {(appCtx) => {
          return (
            <Route render={(ctx) => {
              const { mutation, formId, ...otherProps } = this.props;
              const isOurs = (sub: AppLegacyFormSubmission) =>
                sub.POST['graphql'] === mutation.graphQL &&
                sub.POST['legacyFormId'] === formId;
              const props: FormSubmitterProps<FormInput, FormOutput> = {
                ...otherProps,
                onSubmit: createMutationSubmitHandler(appCtx.fetch, mutation.fetch),
                extraFields: (
                  <React.Fragment>
                    <input type="hidden" name="graphql" value={mutation.graphQL} />
                    {formId && <input type="hidden" name="legacyFormId" value={formId}/>}
                    {otherProps.extraFields}
                  </React.Fragment>
                )
              };
              return <LegacyFormSubmissionWrapper
                      isSubmissionOurs={isOurs} {...props} {...ctx} />
            }} />
          );
        }}
      </AppContext.Consumer>
    );
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

export interface BaseFormProps<FormInput> {
  isLoading: boolean;
  errors?: FormlikeErrors<FormInput>;
}

export interface FormProps<FormInput> extends BaseFormProps<FormInput> {
  onSubmit: (input: FormInput) => void;
  onChange?: (input: FormInput) => void;
  idPrefix: string;
  initialState: FormInput;
  children: (context: FormContext<FormInput>) => JSX.Element;
  extraFields?: JSX.Element;
  extraFormAttributes?: HTMLFormAttrs;
}

export interface FormContext<FormInput> {
  submit: () => void,
  isLoading: boolean;
  fieldPropsFor: <K extends (keyof FormInput) & string>(field: K) => BaseFormFieldProps<FormInput[K]>;
  mapFormsetItems<K extends (keyof FormInput) & string>(field: K, cb: FormContextRenderer<Unarrayed<FormInput[K]>>): JSX.Element;
}

/** This class encapsulates view logic for forms. */
export class Form<FormInput> extends React.Component<FormProps<FormInput>, FormInput> {
  constructor(props: FormProps<FormInput>) {
    super(props);
    this.state = props.initialState;
  }

  static defaultProps = {
    idPrefix: ''
  };

  @autobind
  handleChange(field: string, value: any) {
    this.setState({ [field]: value } as any);
  }

  @autobind
  submit() {
    if (!this.props.isLoading) {
      this.props.onSubmit(this.state);
    }
  }

  @autobind
  handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    this.submit();
  }

  componentDidUpdate(prevProps: FormProps<FormInput>, prevState: FormInput) {
    if (prevState !== this.state && this.props.onChange) {
      this.props.onChange(this.state);
    }
  }

  render() {
    const { errors } = this.props;
    let formsetErrors: FormsetErrors<FormInput>|undefined;
    let formErrors: FormErrors<FormInput>|undefined;

    if (isFormsetErrors(errors)) {
      formsetErrors = errors;
    } else {
      formErrors = errors;
    }

    return (
      <form {...this.props.extraFormAttributes} onSubmit={this.handleSubmit}>
        {this.props.extraFields}
        {this.props.isLoading && <AriaAnnouncement text="Loading..." />}
        {this.props.errors && <AriaAnnouncement text="Your form submission had errors." />}
        {formsetErrors ? <NonFormErrors errors={formsetErrors} /> : <NonFieldErrors errors={formErrors} />}
        <FormFields
          onChange={this.handleChange}
          submit={this.submit}
          idPrefix={this.props.idPrefix}
          namePrefix=""
          input={this.state}
          children={this.props.children}
          isLoading={this.props.isLoading}
          errors={formErrors}
          formsetErrors={formsetErrors}
        />
      </form>
    );
  }
}

export interface FormFieldsProps<FormInput> {
  isLoading: boolean;
  errors?: FormErrors<FormInput>;
  formsetErrors?: FormsetErrors<any>;
  onChange: (field: string, value: any) => void;
  submit: () => void;
  idPrefix: string;
  namePrefix: string;
  input: FormInput;
  children: FormContextRenderer<FormInput>;
}

export class FormFields<FormInput> extends React.Component<FormFieldsProps<FormInput>> {
  @autobind
  fieldPropsFor<K extends (keyof FormInput) & string>(field: K): BaseFormFieldProps<FormInput[K]>  {
    return {
      onChange: (value) => {
        this.props.onChange(field, value);
      },
      errors: this.props.errors && this.props.errors.fieldErrors[field],
      value: this.props.input[field],
      name: (this.props.namePrefix || '') + field,
      id: `${this.props.idPrefix}${field}`,
      isDisabled: this.props.isLoading
    };
  }

  @autobind
  mapFormsetItems<K extends (keyof FormInput) & string>(field: K, cb: FormContextRenderer<Unarrayed<FormInput[K]>>): JSX.Element {
    const val = this.props.input[field];
    if (!Array.isArray(val)) {
      throw new Error('field value must be an array');
    }
    const handleChange = (itemField: string, itemValue: any, index: number) => {
      const newVal = val.slice();
      newVal[index] = {
        ...val[index],
        [itemField]: itemValue
      };
      this.props.onChange(field, newVal);
    };
    return <>
      <input type="hidden" name={`${field}-TOTAL_FORMS`} value={val.length} />

      {/* TODO: We should probably come up with a better value here. */}
      <input type="hidden" name={`${field}-INITIAL_FORMS`} value="0" />

      {/* TODO: We should probably come up with a better value here. */}
      <input type="hidden" name={`${field}-MAX_NUM_FORMS`} value="" />

      {val.map((item: Unarrayed<FormInput[K]>, i) => {
        let errors: FormErrors<typeof item>|undefined;

        if (this.props.formsetErrors) {
          errors = this.props.formsetErrors.formErrors[i];
        }

        return <FormFields
          key={i}
          isLoading={this.props.isLoading}
          onChange={(field, value) => handleChange(field, value, i) }
          submit={() => { throw new Error('submit should never be called by formset items'); }}
          errors={errors}
          idPrefix={`${this.props.idPrefix}${field}-${i}-`}
          namePrefix={`${field}-${i}-`}
          input={item}
          children={cb}
        />
      })}
    </>;
  }

  render() {
    return this.props.children({
      isLoading: this.props.isLoading,
      submit: this.props.submit,
      fieldPropsFor: this.fieldPropsFor,
      mapFormsetItems: this.mapFormsetItems
    });
  }
}
