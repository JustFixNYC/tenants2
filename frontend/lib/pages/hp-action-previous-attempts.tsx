import React from 'react';

import { MiddleProgressStep } from "../progress-step-route";
import Page from "../page";
import { SessionUpdatingFormSubmitter, FormContext } from "../forms";
import { getInitialFormInput } from "../form-input-converter";
import { YesNoRadiosFormField, YES_NO_RADIOS_TRUE, YesNoRadiosFormFieldProps, YES_NO_RADIOS_FALSE } from '../yes-no-radios-form-field';
import { BackButton, NextButton } from '../buttons';
import { AllSessionInfo } from '../queries/AllSessionInfo';
import { BlankHPActionPreviousAttemptsInput, HpActionPreviousAttemptsMutation } from '../queries/HpActionPreviousAttemptsMutation';
import { HPActionPreviousAttemptsInput } from '../queries/globalTypes';
import { HiddenFormField, BaseFormFieldProps } from '../form-fields';

function getInitialState(session: AllSessionInfo): HPActionPreviousAttemptsInput {
  return getInitialFormInput(
    session.hpActionDetails,
    BlankHPActionPreviousAttemptsInput,
    hp => hp.yesNoRadios(
      'filedWith311', 'thirtyDaysSince311', 'hpdIssuedViolations',
      'thirtyDaysSinceViolations', 'urgentAndDangerous'
    ).finish()
  );
}

type WithHidden = { hidden: boolean };

type ConditionalYesNoRadiosFieldProps = YesNoRadiosFormFieldProps & WithHidden;

function hideByDefault<T>(props: BaseFormFieldProps<T>): BaseFormFieldProps<T> & WithHidden {
  return {...props, hidden: true};
}

/**
 * A yes/no radios form field, but conditionally rendered.  It always
 * renders at least an <input type="hidden"> to ensure that progressive
 * enhancement will still work.
 */
function ConditionalYesNoRadiosFormField(props: ConditionalYesNoRadiosFieldProps) {
  if (!props.hidden || props.errors) {
    return <YesNoRadiosFormField {...props} />;
  }
  return <HiddenFormField {...props} />;
}

function renderQuestions(ctx: FormContext<HPActionPreviousAttemptsInput>) {
  const filedWith311 = ctx.fieldPropsFor('filedWith311');
  const hpdIssuedViolations = hideByDefault(ctx.fieldPropsFor('hpdIssuedViolations'));
  const thirtyDaysSince311 = hideByDefault(ctx.fieldPropsFor('thirtyDaysSince311'));
  const thirtyDaysSinceViolations = hideByDefault(ctx.fieldPropsFor('thirtyDaysSinceViolations'));

  if (filedWith311.value === YES_NO_RADIOS_TRUE) {
    hpdIssuedViolations.hidden = false;
    if (hpdIssuedViolations.value === YES_NO_RADIOS_FALSE) {
      thirtyDaysSince311.hidden = false;
    }
    if (hpdIssuedViolations.value === YES_NO_RADIOS_TRUE) {
      thirtyDaysSinceViolations.hidden = false;
    }
  }

  return <>
    <YesNoRadiosFormField {...filedWith311} label="Have you filed any complaints with 311 already?" />
    <ConditionalYesNoRadiosFormField {...hpdIssuedViolations} label="Did HPD issue any Violations?" />
    <ConditionalYesNoRadiosFormField {...thirtyDaysSince311} label="Have 30 days passed since you filed the complaints?" />
    <ConditionalYesNoRadiosFormField {...thirtyDaysSinceViolations} label="Have 30 days passed since the Violations were issued?" />
  </>;
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
        {renderQuestions(ctx)}
        <div className="buttons jf-two-buttons">
          <BackButton to={props.prevStep} />
          <NextButton isLoading={ctx.isLoading} />
        </div>
      </>}
    </SessionUpdatingFormSubmitter>
  </Page>
));
