import React from 'react';
import { AllSessionInfo } from './queries/AllSessionInfo';
import Routes from './routes';
import { Redirect, Route } from 'react-router';
import { LocationDescriptor } from 'history';
import OnboardingStep1 from './pages/onboarding-step-1';
import { GraphQLFetch } from './graphql-client';
import OnboardingStep2 from './pages/onboarding-step-2';
import OnboardingStep3 from './pages/onboarding-step-3';
import OnboardingStep4 from './pages/onboarding-step-4';
import { RouteProgressBar } from './progress-bar';


export function getLatestOnboardingStep(session: AllSessionInfo): LocationDescriptor {
  let target = Routes.onboarding.step1;

  if (session.onboardingStep1) {
    target = Routes.onboarding.step2
  }

  if (session.onboardingStep2) {
    target = Routes.onboarding.step3;
  }

  if (session.onboardingStep3) {
    target = Routes.onboarding.step4;
  }

  return target;
}

export function RedirectToLatestOnboardingStep(props: { session: AllSessionInfo }): JSX.Element {
  return <Redirect to={getLatestOnboardingStep(props.session)} />
}

export interface OnboardingRoutesProps {
  session: AllSessionInfo;
  fetch: GraphQLFetch;
  onCancelOnboarding: () => void;
  onSessionChange: (session: Partial<AllSessionInfo>) => void;
}

export default function OnboardingRoutes(props: OnboardingRoutesProps): JSX.Element {
  return (
    <div>
      <Route path={Routes.onboarding.latestStep} exact render={() => (
        <RedirectToLatestOnboardingStep session={props.session} />
      )} />
      <RouteProgressBar label="Onboarding">
        <Route path={Routes.onboarding.step1}>
          <OnboardingStep1
            onCancel={props.onCancelOnboarding}
            fetch={props.fetch}
            onSuccess={props.onSessionChange}
            initialState={props.session.onboardingStep1}
          />
        </Route>
        <Route path={Routes.onboarding.step2}>
          <OnboardingStep2
            fetch={props.fetch}
            onSuccess={props.onSessionChange}
            initialState={props.session.onboardingStep2}
          />
        </Route>
        <Route path={Routes.onboarding.step3} component={OnboardingStep3} />
        <Route path={Routes.onboarding.step4} component={OnboardingStep4} />
      </RouteProgressBar>
    </div>
  );
}
