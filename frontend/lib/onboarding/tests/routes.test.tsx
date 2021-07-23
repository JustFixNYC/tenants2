import React from "react";

import { FakeSessionInfo } from "../../tests/util";
import OnboardingRoutes, { OnboardingRoutesProps } from "../routes";
import JustfixRoutes from "../../justfix-route-info";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { getLatestStep } from "../../progress/progress-redirection";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { OnboardingInfoSignupIntent } from "../../queries/globalTypes";
import { newSb } from "../../tests/session-builder";

const PROPS: OnboardingRoutesProps = {
  toCancel: "/cancel",
  toSuccess: "/success",
  routes: JustfixRoutes.locale.locOnboarding,
  signupIntent: OnboardingInfoSignupIntent.LOC,
};

const COMPLETED_STEP_1 = newSb().withOnboardingScaffolding({
  firstName: "boop",
  lastName: "jones",
  phoneNumber: "5551234567",
  borough: "MANHATTAN",
  street: "123 Doombringer",
  aptNumber: "2",
});

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
    expect(getLatestOnboardingStep(COMPLETED_STEP_1.value)).toBe(
      JustfixRoutes.locale.locOnboarding.step3
    );
  });

  it("returns step 4 when step 3 is complete", () => {
    expect(
      getLatestOnboardingStep(
        COMPLETED_STEP_1.withOnboardingScaffolding({
          leaseType: "RENT_STABILIZED",
          receivesPublicAssistance: false,
        }).value
      )
    ).toBe(JustfixRoutes.locale.locOnboarding.step4);
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
