import React from 'react';

import { SessionUpdatingFormOutput, FormContext, SessionUpdatingFormSubmitter } from "./forms";
import { FetchMutationInfo } from "./forms-graphql";
import { FormInputConverter, getInitialFormInput } from "./form-input-converter";
import { MiddleProgressStep } from "./progress-step-route";
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
  toFormInput: (hp: FormInputConverter<SessionValue>) => FormInput,
  renderForm: (ctx: FormContext<FormInput>) => JSX.Element,
};

export class SessionStepBuilder<SessionValue> {
  constructor(readonly fromSession: (session: AllSessionInfo) => SessionValue|null) {
  }

  createStep<FormInput, FormOutput extends SessionUpdatingFormOutput>(
    options: SessionStepOptions<FormInput, FormOutput, SessionValue>
  ) {
    const { fromSession } = this;

    return MiddleProgressStep(({ nextStep, prevStep }) => (
      <Page title={options.title} withHeading>
        {options.renderIntro
          ? <div className="content">{options.renderIntro()}</div>
          : null}
        <SessionUpdatingFormSubmitter
          mutation={options.mutation}
          onSuccessRedirect={nextStep}
          initialState={session => getInitialFormInput(
            fromSession(session),
            options.mutation.blankInput,
            options.toFormInput
          )}
        >
          {(ctx) => <>
            {options.renderForm(ctx)}
            <ProgressButtons back={prevStep} isLoading={ctx.isLoading} />
          </>}
        </SessionUpdatingFormSubmitter>
      </Page>
    ));  
  }
}
