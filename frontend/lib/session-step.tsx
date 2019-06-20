import React from 'react';

import { SessionUpdatingFormOutput, FormContext, SessionUpdatingFormSubmitter } from "./forms";
import { FetchMutationInfo } from "./forms-graphql";
import { FormInputConverter, getInitialFormInput } from "./form-input-converter";
import { MiddleProgressStep, MiddleProgressStepProps } from "./progress-step-route";
import Page from "./page";
import { ProgressButtons } from './buttons';
import { AllSessionInfo } from './queries/AllSessionInfo';
import { WithServerFormFieldErrors } from './form-errors';

export type MutationWithBlankInput<FormInput, FormOutput extends WithServerFormFieldErrors> = {
  blankInput: FormInput
} & FetchMutationInfo<FormInput, FormOutput>;

export type SessionStepOptions<FormInput, FormOutput extends SessionUpdatingFormOutput, SessionValue> = {
  title: string,
  renderIntro?: () => JSX.Element,
  mutation: MutationWithBlankInput<FormInput, FormOutput>,
  blankInput?: FormInput,
  onSuccessRedirect?: (output: FormOutput, input: FormInput) => string|undefined|false;
  toFormInput: (hp: FormInputConverter<SessionValue>) => FormInput,
  renderForm: (ctx: FormContext<FormInput>) => JSX.Element,
};

function noop() {}

export class SessionStepBuilder<SessionValue> {
  constructor(readonly fromSession: (session: AllSessionInfo) => SessionValue|null) {
  }

  createStep<FormInput, FormOutput extends SessionUpdatingFormOutput>(
    options: SessionStepOptions<FormInput, FormOutput, SessionValue>|
             ((props: MiddleProgressStepProps) => SessionStepOptions<FormInput, FormOutput, SessionValue>)
  ) {
    const { fromSession } = this;

    return MiddleProgressStep(props => {
      const { nextStep, prevStep } = props;
      const o = typeof(options) === 'function' ? options(props) : options;
      const onSuccessRedirect = o.onSuccessRedirect || noop;

      return (
        <Page title={o.title} withHeading>
          {o.renderIntro ? <div className="content">{o.renderIntro()}</div> : null}
          <SessionUpdatingFormSubmitter
            mutation={o.mutation}
            onSuccessRedirect={(o, i) => onSuccessRedirect(o, i) || nextStep}
            initialState={session => getInitialFormInput(
              fromSession(session),
              o.blankInput || o.mutation.blankInput,
              o.toFormInput
            )}
          >
            {(ctx) => <>
              {o.renderForm(ctx)}
              <ProgressButtons back={prevStep} isLoading={ctx.isLoading} />
            </>}
          </SessionUpdatingFormSubmitter>
        </Page>
      );
    });
  }
}
