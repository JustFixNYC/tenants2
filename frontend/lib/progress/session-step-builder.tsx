import React from "react";

import {
  SessionUpdatingFormOutput,
  SessionUpdatingFormSubmitter,
} from "../forms/session-updating-form-submitter";
import { FetchMutationInfo } from "../forms/forms-graphql";
import {
  FormInputConverter,
  getInitialFormInput,
} from "../forms/form-input-converter";
import {
  MiddleProgressStep,
  MiddleProgressStepProps,
} from "./progress-step-route";
import Page from "../ui/page";
import { ProgressButtons } from "../ui/buttons";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { WithServerFormFieldErrors } from "../forms/form-errors";
import { FormContext } from "../forms/form-context";

/**
 * A structure, usually created by querybuilder, which contains information
 * about a GraphQL mutation, along with "blank input" that will pass GraphQL
 * type validation.
 */
export type MutationWithBlankInput<
  FormInput,
  FormOutput extends WithServerFormFieldErrors
> = {
  /**
   * Blank input for the mutation that will pass GraphQL type validation.
   * All strings will be empty, all booleans will be false, and so on.
   */
  blankInput: FormInput;
} & FetchMutationInfo<FormInput, FormOutput>;

/**
 * Options describing a progress step that updates a particular "chunk" of the
 * user's session.
 */
export type SessionStepOptions<
  FormInput,
  FormOutput extends SessionUpdatingFormOutput,
  SessionChunk
> = {
  /** The title of the step, visible both in the document title and as a heading. */
  title: string;

  /**
   * Convert the session chunk to the form input.
   */
  toFormInput: (converter: FormInputConverter<SessionChunk>) => FormInput;

  /** Render the form's fields. */
  renderForm: (ctx: FormContext<FormInput>) => JSX.Element;

  /**
   * Optional blank input to use if the session doesn't contain any information
   * relevant to the form's input. If not provided, the mutation's blank input
   * will be used.
   */
  blankInput?: FormInput;

  /**
   * An optional function to call that can return an alternative URL to
   * redirect to on successful form submission. If not provided, or if the function
   * returns a falsy value, we'll go to the next step.
   */
  onSuccessRedirect?: (
    output: FormOutput,
    input: FormInput
  ) => string | undefined | false;

  /** Optionally render any introductory text that appears before the form. */
  renderIntro?: () => JSX.Element;
};

function noop() {}

/**
 * This class makes it easier to build progress steps that update a particular
 * "chunk" of the user's session state.
 */
export class SessionStepBuilder<SessionChunk> {
  constructor(
    readonly fromSession: (session: AllSessionInfo) => SessionChunk | null
  ) {}

  /**
   * Return a React stateless functional component that renders a form step.
   */
  createStep<FormInput, FormOutput extends SessionUpdatingFormOutput>(
    mutation: MutationWithBlankInput<FormInput, FormOutput>,
    options:
      | SessionStepOptions<FormInput, FormOutput, SessionChunk>
      | ((
          props: MiddleProgressStepProps
        ) => SessionStepOptions<FormInput, FormOutput, SessionChunk>)
  ) {
    const { fromSession } = this;

    return MiddleProgressStep((props) => {
      const { nextStep, prevStep } = props;
      const o = typeof options === "function" ? options(props) : options;
      const onSuccessRedirect = o.onSuccessRedirect || noop;

      return (
        <Page title={o.title} withHeading>
          {o.renderIntro ? (
            <div className="content">{o.renderIntro()}</div>
          ) : null}
          <SessionUpdatingFormSubmitter
            mutation={mutation}
            onSuccessRedirect={(o, i) => onSuccessRedirect(o, i) || nextStep}
            initialState={(session) =>
              getInitialFormInput(
                fromSession(session),
                o.blankInput || mutation.blankInput,
                o.toFormInput
              )
            }
          >
            {(ctx) => (
              <>
                {o.renderForm(ctx)}
                <ProgressButtons back={prevStep} isLoading={ctx.isLoading} />
              </>
            )}
          </SessionUpdatingFormSubmitter>
        </Page>
      );
    });
  }
}
