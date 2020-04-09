import React from 'react';

import Page from "../page";
import { SessionUpdatingFormSubmitter } from '../session-updating-form-submitter';
import Routes from '../routes';
import { FormContext } from '../form-context';
import { ReliefAttemptsMutation } from '../queries/ReliefAttemptsMutation';
import { ReliefAttemptsInput } from "../queries/globalTypes"
import { YesNoRadiosFormField } from '../yes-no-radios-form-field';
import { ProgressButtons } from '../buttons';
import { toStringifiedNullBool } from '../form-input-converter';


function renderForm(ctx: FormContext<ReliefAttemptsInput>): JSX.Element {
  return (
    <React.Fragment>
      <YesNoRadiosFormField {...ctx.fieldPropsFor('hasCalled311')} label="Have you previously called 311 with no results?" />
      <ProgressButtons back={Routes.locale.loc.accessDates} isLoading={ctx.isLoading} />
    </React.Fragment>
  );
}

export default function ReliefAttemptsPage(): JSX.Element {
  return (
    <Page title="Previous attempts to get help">
      <div>
        <h1 className="title is-4 is-spaced">Previous attempts to get official help</h1>
        <p className="subtitle is-6">It is encouraged that you call 311 to report housing complaints directly with the City. 
        By calling, you will trigger a formal inspection process that may lead to official violations being issued.</p>
        <SessionUpdatingFormSubmitter
          mutation={ReliefAttemptsMutation}
          initialState={(session) => ({
              hasCalled311: toStringifiedNullBool(session.onboardingInfo?.hasCalled311 ?? null ) 
            })}
          onSuccessRedirect={Routes.locale.loc.yourLandlord}
          >
            {renderForm}
        </SessionUpdatingFormSubmitter>
      </div>
    </Page>
  );
}