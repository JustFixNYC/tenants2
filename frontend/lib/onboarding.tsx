import React from 'react';
import { AllSessionInfo } from './queries/AllSessionInfo';
import Routes from './routes';
import { Redirect } from 'react-router';
import { LocationDescriptor } from 'history';


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
