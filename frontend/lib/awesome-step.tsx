import React from 'react';

import { SessionUpdatingFormOutput, FormContext, SessionToFormInputFn, SessionUpdatingFormSubmitter } from "./forms";
import { FetchMutationInfo } from "./forms-graphql";
import { FormInputConverter } from "./form-input-converter";
import { MiddleProgressStep } from "./progress-step-route";
import Page from "./page";
import { ProgressButtons } from './buttons';

export type AwesomeStepOptions<FormInput, FormOutput extends SessionUpdatingFormOutput, T> = {
  title: string,
  renderIntro?: () => JSX.Element,
  mutation: FetchMutationInfo<FormInput, FormOutput>,
  blank: FormInput,
  toFormInput: (hp: FormInputConverter<T>) => FormInput,
  renderForm: (ctx: FormContext<FormInput>) => JSX.Element,
};

export function createAwesomeStep<FormInput, FormOutput extends SessionUpdatingFormOutput, T>(
  options: AwesomeStepOptions<FormInput, FormOutput, T>,
  initialState: SessionToFormInputFn<FormInput>
) {
  return MiddleProgressStep(({ nextStep, prevStep }) => (
    <Page title={options.title} withHeading>
      {options.renderIntro
        ? <div className="content">{options.renderIntro()}</div>
        : null}
      <SessionUpdatingFormSubmitter
        mutation={options.mutation}
        onSuccessRedirect={nextStep}
        initialState={initialState}
      >
        {(ctx) => <>
          {options.renderForm(ctx)}
          <ProgressButtons back={prevStep} isLoading={ctx.isLoading} />
        </>}
      </SessionUpdatingFormSubmitter>
    </Page>
  ));
}
