import React from "react";

import { FakeSessionInfo } from "../../tests/util";
import OnboardingRoutes, { OnboardingRoutesProps } from "../routes";
import JustfixRoutes from "../../justfix-route-info";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { getLatestStep } from "../../progress/progress-redirection";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { OnboardingInfoSignupIntent } from "../../queries/globalTypes";

const PROPS: OnboardingRoutesProps = {
  toCancel: "/cancel",
  toSuccess: "/success",
  routes: JustfixRoutes.locale.locOnboarding,
  signupIntent: OnboardingInfoSignupIntent.LOC,
};

describe("latest step redirector", () => {
  function getLatestOnboardingStep(session: AllSessionInfo): string {
    const routes = new OnboardingRoutes(PROPS);
    return getLatestStep(session, routes.onboardingSteps);
  }

  it("returns step 1 by default", () => {
    expect(getLatestOnboardingStep(FakeSessionInfo)).toBe(
      JustfixRoutes.locale.locOnboarding.step1
    );
  });
});

describe("Onboarding", () => {
  it("redirects to latest step", () => {
    const pal = new AppTesterPal(<OnboardingRoutes {...PROPS} />, {
      url: JustfixRoutes.locale.locOnboarding.latestStep,
    });
    expect(pal.history.location.pathname).toEqual("/en/onboarding/step/1");
    pal.rr.getByLabelText("Legal first name");
  });
});
