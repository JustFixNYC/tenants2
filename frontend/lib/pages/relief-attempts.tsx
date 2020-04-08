import React from 'react';

import Page from "../page";
// import { SessionUpdatingFormSubmitter } from '../session-updating-form-submitter';
// import Routes from '../routes';
// import { OnboardingStep2Mutation, BlankOnboardingStep2Input } from '../queries/OnboardingStep2Mutation';
// import { OnboardingStep2Input } from '../queries/globalTypes';
// import { FormContext } from '../form-context';
// import { YesNoRadiosFormField } from '../yes-no-radios-form-field';

// function renderForm(ctx: FormContext<OnboardingStep2Input>): JSX.Element {
//   console.log({...ctx.fieldPropsFor('hasCalled311')})
//   return (
//     <YesNoRadiosFormField
//         {...ctx.fieldPropsFor('hasCalled311')}
//         label="Have you previously called 311 with no results?"
//       />
//   );
// }

export default function ReliefAttemptsPage(): JSX.Element {
  return (
    <Page title="Called 311">
      <div>
        <h1 className="title is-4 is-spaced">Previous attempts to get official help</h1>
        <p className="subtitle is-6">It is encouraged that you <strong>call 311 to report housing complaints</strong> directly with the City. 
        By calling, you will trigger a formal inspection process that may lead to official violations being issued.</p>
        {/* <SessionUpdatingFormSubmitter
          mutation={OnboardingStep2Mutation}
          initialState={(session) => session.onboardingStep2 || BlankOnboardingStep2Input}
          onSuccessRedirect={Routes.locale.loc.yourLandlord}
        >
          {renderForm}
        </SessionUpdatingFormSubmitter> */}
      </div>
    </Page>
  );
}