import React from "react";

import { FakeSessionInfo } from "../../tests/util";
import OnboardingRoutes, { OnboardingRoutesProps } from "../onboarding-routes";
import JustfixRoutes from "../../justfix-routes";
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

  it("returns step 3 when step 1 is complete", () => {
    expect(
      getLatestOnboardingStep({
        ...FakeSessionInfo,
        onboardingStep1: {} as any,
      })
    ).toBe(JustfixRoutes.locale.locOnboarding.step3);
  });

  it("returns step 4 when step 3 is complete", () => {
    expect(
      getLatestOnboardingStep({
        ...FakeSessionInfo,
        onboardingStep1: {} as any,
        onboardingStep3: {} as any,
      })
    ).toBe(JustfixRoutes.locale.locOnboarding.step4);
  });
});

describe("Onboarding", () => {
  it("redirects to latest step", () => {
    const pal = new AppTesterPal(<OnboardingRoutes {...PROPS} />, {
      url: JustfixRoutes.locale.locOnboarding.latestStep,
    });
    expect(pal.history.location.pathname).toEqual("/en/onboarding/step/1");
    pal.rr.getByLabelText("First name");
  });
});