import React from 'react';

import { MiddleProgressStep } from "../progress-step-route";
import Page from "../page";
import { SessionUpdatingFormSubmitter } from "../forms";
import { getInitialFormInput } from "../form-input-converter";
import { YesNoRadiosFormField } from '../yes-no-radios-form-field';
import { BackButton, NextButton } from '../buttons';
import { AllSessionInfo } from '../queries/AllSessionInfo';
import { BlankHPActionPreviousAttemptsInput, HpActionPreviousAttemptsMutation } from '../queries/HpActionPreviousAttemptsMutation';
import { HPActionPreviousAttemptsInput } from '../queries/globalTypes';

function getInitialState(session: AllSessionInfo): HPActionPreviousAttemptsInput {
  return getInitialFormInput(
    session.hpActionDetails,
    BlankHPActionPreviousAttemptsInput,
    hp => hp.yesNoRadios(
      'filedWith311', 'thirtyDaysSince311', 'hpdIssuedViolations',
      'issuesFixed', 'urgentAndDangerous'
    ).finish()
  );
}

export const HPActionPreviousAttempts = MiddleProgressStep(props => (
  <Page title="Previous attempts to get help" withHeading>
    <SessionUpdatingFormSubmitter
      mutation={HpActionPreviousAttemptsMutation}
      onSuccessRedirect={props.nextStep}
      initialState={getInitialState}
    >
      {ctx => <>
        <div className="content">
          <p>It is important for the court to know if you have already tried to get help from the city to resolve your issues.</p>
        </div>
        <YesNoRadiosFormField {...ctx.fieldPropsFor('filedWith311')} label="Have you filed any complaints with 311 already?" />
        <YesNoRadiosFormField {...ctx.fieldPropsFor('thirtyDaysSince311')} label="Have 30 days passed since you filed the complaints?" />
        <YesNoRadiosFormField {...ctx.fieldPropsFor('hpdIssuedViolations')} label="Did HPD issue any Violations?" />
        <YesNoRadiosFormField {...ctx.fieldPropsFor('issuesFixed')} label="Have the issues been fixed?" />
        <YesNoRadiosFormField {...ctx.fieldPropsFor('urgentAndDangerous')} label="Are the conditions urgent and dangerous?" />
        <div className="buttons jf-two-buttons">
          <BackButton to={props.prevStep} />
          <NextButton isLoading={ctx.isLoading} />
        </div>
      </>}
    </SessionUpdatingFormSubmitter>
  </Page>
));
