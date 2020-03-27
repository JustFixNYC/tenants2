import React from 'react';
import { OnboardingRouteInfo } from './routes';
import { Route, Switch } from 'react-router';
import OnboardingStep1 from './pages/onboarding-step-1';
import OnboardingStep2 from './pages/onboarding-step-2';
import OnboardingStep3 from './pages/onboarding-step-3';
import OnboardingStep4 from './pages/onboarding-step-4';
import { RouteProgressBar } from './progress-bar';
import { RedirectToLatestStep } from './progress-redirection';
import { OnboardingInfoSignupIntent } from './queries/globalTypes';
import { ProgressStepRoute } from './progress-step-route';
import { OnboardingThanks } from './pages/onboarding-thanks';

export type OnboardingRoutesProps = {
  toCancel: string;
  toSuccess: string;
  routes: OnboardingRouteInfo;
  signupIntent: OnboardingInfoSignupIntent;
};

export default class OnboardingRoutes extends React.Component<OnboardingRoutesProps> {
  readonly onboardingSteps: ProgressStepRoute[];

  constructor(props: OnboardingRoutesProps) {
    super(props);

    const { routes } = props;

    this.onboardingSteps = [
      { path: routes.step1,
        render: () => <OnboardingStep1 routes={routes} toCancel={props.toCancel} />,
        isComplete: (s) => !!s.onboardingStep1 },
      { path: routes.step2,
        render: () => <OnboardingStep2 routes={routes} />,
        isComplete: (s) => !!s.onboardingStep2
      },
      { path: routes.step3,
        render: () => <OnboardingStep3 routes={routes} />,
        isComplete: (s) => !!s.onboardingStep3
      },
      { path: routes.step4,
        render: () => <OnboardingStep4 routes={routes} toSuccess={routes.thanks}
                                       signupIntent={props.signupIntent} />
      },
      {
        path: routes.thanks,
        render: () => <OnboardingThanks next={props.toSuccess} />
      }
    ];
  }

  render() {
    return (
      <div>
        <Switch>
          <Route path={this.props.routes.latestStep} exact render={() => (
            <RedirectToLatestStep steps={this.onboardingSteps}/>
          )} />
          <Route render={() => (
            <RouteProgressBar label="Create an Account" steps={this.onboardingSteps} />
          )} />
        </Switch>
      </div>
    );
  }
}
