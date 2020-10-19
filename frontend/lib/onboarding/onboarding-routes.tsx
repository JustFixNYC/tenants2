import React from "react";
import { OnboardingRouteInfo } from "../justfix-routes";
import { Route, Switch } from "react-router";
import OnboardingStep1 from "./onboarding-step-1";
import OnboardingStep3 from "./onboarding-step-3";
import OnboardingStep4 from "./onboarding-step-4";
import { RouteProgressBar } from "../progress/progress-bar";
import { RedirectToLatestStep } from "../progress/progress-redirection";
import { OnboardingInfoSignupIntent } from "../queries/globalTypes";
import { ProgressStepRoute } from "../progress/progress-step-route";
import { OnboardingThanks } from "./onboarding-thanks";
import { li18n } from "../i18n-lingui";
import { t } from "@lingui/macro";

export type OnboardingRoutesProps = {
  toCancel: string;
  toSuccess: string;
  routes: OnboardingRouteInfo;
  signupIntent: OnboardingInfoSignupIntent;
};

export default class OnboardingRoutes extends React.Component<
  OnboardingRoutesProps
> {
  readonly onboardingSteps: ProgressStepRoute[];

  constructor(props: OnboardingRoutesProps) {
    super(props);

    const { routes, signupIntent } = props;

    this.onboardingSteps = [
      {
        path: routes.step1,
        render: () => (
          <OnboardingStep1
            routes={routes}
            toCancel={props.toCancel}
            signupIntent={signupIntent}
          />
        ),
        isComplete: (s) => !!s.onboardingStep1,
      },
      {
        path: routes.step3,
        render: () => <OnboardingStep3 routes={routes} />,
        isComplete: (s) => !!s.onboardingStep3,
      },
      {
        path: routes.step4,
        render: () => (
          <OnboardingStep4
            routes={routes}
            toSuccess={routes.thanks}
            signupIntent={signupIntent}
          />
        ),
      },
      {
        path: routes.thanks,
        render: () => <OnboardingThanks next={props.toSuccess} />,
      },
    ];
  }

  render() {
    return (
      <div>
        <Switch>
          <Route
            path={this.props.routes.latestStep}
            exact
            render={() => <RedirectToLatestStep steps={this.onboardingSteps} />}
          />
          <Route
            render={() => (
              <RouteProgressBar
                label={li18n._(t`Create an Account`)}
                steps={this.onboardingSteps}
              />
            )}
          />
        </Switch>
      </div>
    );
  }
}
