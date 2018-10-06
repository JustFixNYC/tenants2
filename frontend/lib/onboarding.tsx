import React from 'react';
import { AllSessionInfo } from './queries/AllSessionInfo';
import Routes from './routes';
import { Redirect, Route } from 'react-router';
import { LocationDescriptor } from 'history';
import OnboardingStep1 from './pages/onboarding-step-1';
import OnboardingStep2 from './pages/onboarding-step-2';
import OnboardingStep3 from './pages/onboarding-step-3';
import OnboardingStep4 from './pages/onboarding-step-4';
import { RouteProgressBar, ProgressStepRoute } from './progress-bar';
import { AppContextType, withAppContext } from './app-context';


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

export const RedirectToLatestOnboardingStep = withAppContext((props: AppContextType): JSX.Element => {
  return <Redirect to={getLatestOnboardingStep(props.session)} />
});

const steps: ProgressStepRoute[] = [
  { path: Routes.onboarding.step1, component: OnboardingStep1 },
  { path: Routes.onboarding.step2, component: OnboardingStep2 },
  { path: Routes.onboarding.step3, component: OnboardingStep3 },
  { path: Routes.onboarding.step4, component: OnboardingStep4 },
];

export default function OnboardingRoutes(): JSX.Element {
  return (
    <div>
      <Route path={Routes.onboarding.latestStep} exact component={RedirectToLatestOnboardingStep} />
      <RouteProgressBar label="Onboarding" steps={steps} />
    </div>
  );
}
