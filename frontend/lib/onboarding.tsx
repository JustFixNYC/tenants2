import React from 'react';
import { AllSessionInfo } from './queries/AllSessionInfo';
import Routes from './routes';
import { Redirect, Switch, Route } from 'react-router';
import { LocationDescriptor } from 'history';
import Page from './page';
import OnboardingStep1 from './pages/onboarding-step-1';
import { GraphQLFetch } from './graphql-client';
import { Link } from 'react-router-dom';


export function getLatestOnboardingStep(session: AllSessionInfo): LocationDescriptor {
  let target = Routes.onboarding.step1;

  if (session.onboardingStep1) {
    target = Routes.onboarding.step2
  }

  return target;
}

export function RedirectToLatestOnboardingStep(props: { session: AllSessionInfo }): JSX.Element {
  return <Redirect to={getLatestOnboardingStep(props.session)} />
}

export interface OnboardingRoutesProps {
  session: AllSessionInfo;
  fetch: GraphQLFetch;
  onSessionChange: (session: AllSessionInfo) => void;
}

export default function OnboardingRoutes(props: OnboardingRoutesProps): JSX.Element {
  return (
    <Switch>
      <Route path={Routes.onboarding.latestStep} exact>
        <RedirectToLatestOnboardingStep session={props.session} />
      </Route>
      <Route path={Routes.onboarding.step1}>
        <OnboardingStep1
          fetch={props.fetch}
          onSuccess={props.onSessionChange}
          initialState={props.session.onboardingStep1}
        />
      </Route>
      <Route path={Routes.onboarding.step2} exact>
        <Page title="Oops">
          <p>Sorry, this page hasn't been built yet.</p>
          <br/>
          <Link to={Routes.onboarding.step1}>Go back to step 1</Link>
        </Page>
      </Route>
    </Switch>
  );
}
