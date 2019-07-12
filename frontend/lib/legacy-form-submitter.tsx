import React from 'react';
import { FormSubmitterProps, FormSubmitterPropsWithRouter, getSuccessRedirect, FormSubmitterWithoutRouter } from './form-submitter';
import { WithServerFormFieldErrors, getFormErrors } from './form-errors';
import { FetchMutationInfo, createMutationSubmitHandler } from './forms-graphql';
import { AppContext, AppLegacyFormSubmission } from './app-context';
import { Route } from 'react-router';
import { assertNotNull } from './util';
import { getAppStaticContext } from './app-static-context';


export type LegacyFormSubmitterProps<FormInput, FormOutput extends WithServerFormFieldErrors> = Omit<FormSubmitterProps<FormInput, FormOutput>, 'onSubmit'> & {
  /**
   * The GraphQL mutation that submits the form and returns the
   * server's response.
   */
  mutation: FetchMutationInfo<FormInput, FormOutput>
};

/**
 * A form submitter that supports submission via a GraphQL mutation.
 * 
 * On progressively-enhanced clients, this is done via a client-side
 * network request. For situations where we can't rely on JavaScript, 
 * legacy browser POST is used.
 */
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
          const output: FormOutput|null = appCtx.legacyFormSubmission.result;
          const initialErrors = output && output.errors.length ? getFormErrors<FormInput>(output.errors) : undefined;
          newProps = {
            ...newProps,
            initialState,
            initialErrors
          };
          if (output && output.errors.length === 0) {
            const redirect = getSuccessRedirect(newProps, initialState, output);
            if (redirect) {
              const appStaticCtx = assertNotNull(getAppStaticContext(props));
              appStaticCtx.url = redirect;
              return null;
            }
          }
        }
        return <FormSubmitterWithoutRouter {...newProps} />;
      }}
    </AppContext.Consumer>
  );
}
