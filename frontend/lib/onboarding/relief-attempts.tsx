import React from 'react';

import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from '../forms/session-updating-form-submitter';
import { ReliefAttemptsMutation } from '../queries/ReliefAttemptsMutation';
import { YesNoRadiosFormField } from '../forms/yes-no-radios-form-field';
import { ProgressButtons } from '../ui/buttons';
import { toStringifiedNullBool } from '../forms/form-input-converter';
import { MiddleProgressStep } from '../progress/progress-step-route';


const ReliefAttemptsPage = MiddleProgressStep(props => (
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
          onSuccessRedirect={props.nextStep}
          >
            {ctx => <>
              <YesNoRadiosFormField {...ctx.fieldPropsFor('hasCalled311')} label="Have you previously called 311 with no results?" />
              <ProgressButtons back={props.prevStep} isLoading={ctx.isLoading} />
            </>}
        </SessionUpdatingFormSubmitter>
      </div>
    </Page>
  )
);

export default ReliefAttemptsPage;