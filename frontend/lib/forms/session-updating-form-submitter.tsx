import React from "react";
import { WithServerFormFieldErrors } from "./form-errors";
import { AppContext } from "../app-context";
import { assertNotNull } from "@justfixnyc/util";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import {
  LegacyFormSubmitterProps,
  LegacyFormSubmitter,
} from "./legacy-form-submitter";

export interface SessionUpdatingFormOutput extends WithServerFormFieldErrors {
  /**
   * The output of a successful session-updating GraphQL mutation should
   * contain a subset of the user session.
   *
   * If the form submission had validation errors, however, this
   * may be null.
   */
  session: Partial<AllSessionInfo> | null;
}

/**
 * A callable that takes the user session and converts it into
 * initial input for the form.
 */
export type SessionToFormInputFn<FormInput> = (
  session: AllSessionInfo
) => FormInput;

type SessionUpdatingFormSubmitterProps<
  FormInput,
  FormOutput extends SessionUpdatingFormOutput
> = Omit<LegacyFormSubmitterProps<FormInput, FormOutput>, "initialState"> & {
  /**
   * The initial state of the form's fields may either be data, or a function
   * that takes the current user session and returns data.
   */
  initialState: SessionToFormInputFn<FormInput> | FormInput;
};

/**
 * This form submitter supports a very common use case in which the GraphQL mutation,
 * when successful, simply returns a payload that contains updates to the
 * session state.
 */
export class SessionUpdatingFormSubmitter<
  FormInput,
  FormOutput extends SessionUpdatingFormOutput
> extends React.Component<
  SessionUpdatingFormSubmitterProps<FormInput, FormOutput>
> {
  render() {
    return (
      <AppContext.Consumer>
        {(appCtx) => {
          let initialState =
            typeof this.props.initialState === "function"
              ? // TypeScript 3.1 introduced an extremely confusing breaking change with
                // opaque intentions [1] that broke our type narrowing, and after about an
                // hour of trying I'm giving up and forcing a typecast. This might be easier
                // if Typescript actually had a JSON type [2], since that's essentially what
                // FormInput is, but otherwise I have no idea how to narrow FormInput in
                // such a way that our conditional would result in a type narrowing instead
                // of TypeScript 3.1's bizarre new behavior.
                //
                // [1] https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#narrowing-functions-now-intersects--object-and-unconstrained-generic-type-parameters
                // [2] https://github.com/Microsoft/TypeScript/issues/1897
                (this.props.initialState as SessionToFormInputFn<FormInput>)(
                  appCtx.session
                )
              : this.props.initialState;
          return (
            <LegacyFormSubmitter
              {...this.props}
              initialState={initialState}
              onSuccess={(output) => {
                appCtx.updateSession(assertNotNull(output.session));
                if (this.props.onSuccess) {
                  this.props.onSuccess(output);
                }
              }}
            />
          );
        }}
      </AppContext.Consumer>
    );
  }
}
