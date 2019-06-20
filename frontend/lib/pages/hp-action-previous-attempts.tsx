import React from 'react';

import { MiddleProgressStep } from "../progress-step-route";
import Page from "../page";
import { SessionUpdatingFormSubmitter, FormContext } from "../forms";
import { getInitialFormInput } from "../form-input-converter";
import { YesNoRadiosFormField, YES_NO_RADIOS_TRUE, YES_NO_RADIOS_FALSE } from '../yes-no-radios-form-field';
import { ProgressButtons } from '../buttons';
import { AllSessionInfo } from '../queries/AllSessionInfo';
import { BlankHPActionPreviousAttemptsInput, HpActionPreviousAttemptsMutation } from '../queries/HpActionPreviousAttemptsMutation';
import { HPActionPreviousAttemptsInput } from '../queries/globalTypes';
import { hideByDefault, ConditionalYesNoRadiosFormField } from '../conditional-form-fields';
import Routes from '../routes';
import { Route } from 'react-router';
import { Modal } from '../modal';
import { Link } from 'react-router-dom';

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

function getSuccessRedirect(input: HPActionPreviousAttemptsInput, nextStep: string): string {
  if (input.filedWith311 === YES_NO_RADIOS_FALSE) {
    return Routes.locale.hp.prevAttempts311Modal;
  }
  return nextStep;
}

function ModalFor311(props: { nextStep: string }) {
  const title = "311 is an important tool";
  return (
    <Modal title={title} onCloseGoTo={props.nextStep} >
      <div className="content box">
        <h1 className="title is-4">{title}</h1>
        <p>
          311 complaints are an important tool to help you strengthen your case. You can still file complaints by calling 311 to let the city know what’s going on.
        </p>
        <div className="has-text-centered">
          <Link to={props.nextStep} className="button is-primary is-medium">
            Got it
          </Link>
        </div>
      </div>
    </Modal>
  );
}

export const HPActionPreviousAttempts = MiddleProgressStep(props => (
  <Page title="Previous attempts to get help" withHeading>
    <SessionUpdatingFormSubmitter
      mutation={HpActionPreviousAttemptsMutation}
      onSuccessRedirect={(_, input) => getSuccessRedirect(input, props.nextStep)}
      initialState={getInitialState}
    >
      {ctx => <>
        <div className="content">
          <p>It is important for the court to know if you have already tried to get help from the city to resolve your issues.</p>
        </div>
        {renderQuestions(ctx)}
        <ProgressButtons back={props.prevStep} isLoading={ctx.isLoading} />
      </>}
    </SessionUpdatingFormSubmitter>
    <Route path={Routes.locale.hp.prevAttempts311Modal} render={() => <ModalFor311 {...props} />} />
  </Page>
));
