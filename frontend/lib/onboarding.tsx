import React from 'react';
import Routes, { RouteTypes } from './routes';
import { Route, Redirect, Switch } from 'react-router';
import OnboardingStep1 from './pages/onboarding-step-1';
import OnboardingStep2 from './pages/onboarding-step-2';
import OnboardingStep3 from './pages/onboarding-step-3';
import OnboardingStep4 from './pages/onboarding-step-4';
import { RouteProgressBar } from './progress-bar';
import { SessionProgressStepRoute, RedirectToLatestStep } from './progress-redirection';
import { validateSignupIntent } from './signup-intent';

export const onboardingSteps: SessionProgressStepRoute[] = [
  { path: Routes.onboarding.step1, component: OnboardingStep1, isComplete: (s) => !!s.onboardingStep1 },
  { path: Routes.onboarding.step2, component: OnboardingStep2, isComplete: (s) => !!s.onboardingStep2 },
  { path: Routes.onboarding.step3, component: OnboardingStep3, isComplete: (s) => !!s.onboardingStep3 },
  { path: Routes.onboarding.step4, component: OnboardingStep4 },
];

export const RedirectToLatestOnboardingStep = () => <RedirectToLatestStep steps={onboardingSteps}/>;

function OnboardingForIntent(props: RouteTypes.onboarding.forIntent.RouteProps) {
  const intent = validateSignupIntent(props.match.params.intent);
  return <Redirect to={Routes.onboarding.createStep1WithIntent(intent)} />
}

export default function OnboardingRoutes(): JSX.Element {
  return (
    <div>
      <Route path={Routes.onboarding.latestStep} exact component={RedirectToLatestOnboardingStep} />
      <Switch>
        <Route path={Routes.onboarding.forIntent.parameterizedRoute} exact render={(ctx) => (
          <OnboardingForIntent {...ctx} />
        )} />
        <Route render={() => (
          <RouteProgressBar label="Create an Account" steps={onboardingSteps} />
        )} />
      </Switch>
    </div>
  );
}
