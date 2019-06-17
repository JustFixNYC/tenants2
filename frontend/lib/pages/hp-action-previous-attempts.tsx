import React from 'react';

import { ProgressStepProps } from "../progress-step-route";
import Page from "../page";
import { SessionUpdatingFormSubmitter } from "../forms";
import { HpActionDetailsMutation, BlankHPActionDetailsInput } from "../queries/HpActionDetailsMutation";
import { assertNotNull } from "../util";
import { getInitialFormInput } from "../form-input-converter";
import { YesNoRadiosFormField } from '../yes-no-radios-form-field';
import { BackButton, NextButton } from '../buttons';

export const HPActionPreviousAttempts = (props: ProgressStepProps) => (
  <Page title="Previous attempts to get help" withHeading>
    <SessionUpdatingFormSubmitter
      mutation={HpActionDetailsMutation}
      onSuccessRedirect={assertNotNull(props.nextStep)}
      initialState={({ hpActionDetails }) => getInitialFormInput(
        hpActionDetails,
        BlankHPActionDetailsInput,
        hp => hp.yesNoRadios('filedWith311', 'thirtyDaysSince311', 'hpdIssuedViolations', 'issuesFixed', 'urgentAndDangerous').finish()
      )}
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
          <BackButton to={assertNotNull(props.prevStep)} />
          <NextButton isLoading={ctx.isLoading} />
        </div>
      </>}
    </SessionUpdatingFormSubmitter>
  </Page>
);
