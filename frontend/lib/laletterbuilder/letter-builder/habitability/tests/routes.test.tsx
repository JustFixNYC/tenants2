import { ProgressRoutesTester } from "../../../../progress/tests/progress-routes-tester";
import { newSb } from "../../../../tests/session-builder";
import { PhoneNumberAccountStatus } from "../../../../queries/globalTypes";
import HabitabilityRoutes, {
  getHabitabilityProgressRoutesProps,
} from "../routes";
import { AppTesterPal } from "../../../../tests/app-tester-pal";
import React from "react";
import { LaLetterBuilderRouteInfo } from "../../../route-info";
import { LaLetterBuilderCreateAccountMutation } from "../../../../queries/LaLetterBuilderCreateAccountMutation";
import { override } from "../../../../tests/util";
import { BlankAllSessionInfo } from "../../../../queries/AllSessionInfo";
import { BlankOnboardingScaffolding } from "../../../../queries/OnboardingScaffolding";

const tester = new ProgressRoutesTester(
  getHabitabilityProgressRoutesProps(),
  "LA letter builder flow",
  { server: { siteType: "LALETTERBUILDER" } }
);

tester.defineSmokeTests();

const sb = newSb();

describe("LA letter builder steps", () => {
  tester.defineTest({
    it: "takes brand-new users through habitability onboarding",
    usingSession: sb
      .withQueriedPhoneNumber(PhoneNumberAccountStatus.NO_ACCOUNT)
      .withOnboardingScaffolding({
        city: "Los Angeles",
        state: "CA",
      }),
    expectSteps: [
      "/en/habitability/phone/ask",
      "/en/habitability/name",
      "/en/habitability/city",
      "/en/habitability/address/national",
      "/en/habitability/review-rights",
      "/en/habitability/create-account",
    ],
  });
});

tester.defineTest({
  it: "takes onboarded users through flow to confirmation",
  usingSession: sb.withLoggedInNationalUser().withOnboardingScaffolding({
    hasLandlordEmailAddress: true,
    hasLandlordMailingAddress: true,
  }),
  expectSteps: [
    "/en/habitability/my-letters",
    "/en/habitability/issues",
    "/en/habitability/landlord/info",
    "/en/habitability/access-dates",
    "/en/habitability/preview",
    "/en/habitability/sending",
    "/en/habitability/confirmation",
  ],
});

describe("create account back and next", () => {
  it("goes to review rights if you click back", async () => {
    const pal = new AppTesterPal(<HabitabilityRoutes />, {
      url: LaLetterBuilderRouteInfo.locale.habitability.createAccount,
      updateSession: true,
      session: sb
        .withQueriedPhoneNumber(PhoneNumberAccountStatus.NO_ACCOUNT)
        .withOnboardingScaffolding({
          city: "Los Angeles",
          state: "CA",
        }).value,
    });
    pal.ensureLinkGoesTo(/Back/, "/en/habitability/review-rights");
  });

  it("goes to the my letters page after submission", async () => {
    const pal = new AppTesterPal(<HabitabilityRoutes />, {
      url: LaLetterBuilderRouteInfo.locale.habitability.createAccount,
      updateSession: true,
      session: sb
        .withQueriedPhoneNumber(PhoneNumberAccountStatus.NO_ACCOUNT)
        .withOnboardingScaffolding({
          city: "Los Angeles",
          state: "CA",
        }).value,
    });
    const email = "boopsy@boopmail.com";
    const password = "blar";
    const confirmPassword = "blar";
    const canWeSms = true;
    const agreeToTerms = true;

    pal.fillFormFields([
      [/Email address \(optional\)/, email],
      [/Create a password/, password],
      [/Please confirm your password/, confirmPassword],
    ]);
    pal.clickRadioOrCheckbox(/I agree to the/i);
    pal.clickButtonOrLink("Next");
    pal
      .withFormMutation(LaLetterBuilderCreateAccountMutation)
      .expect({
        email,
        password,
        confirmPassword,
        canWeSms,
        agreeToTerms,
      })
      .respondWithSuccess({
        session: override(BlankAllSessionInfo, {
          onboardingScaffolding: override(BlankOnboardingScaffolding, {
            city: "Los Angeles",
            state: "CA",
          }),
        }),
      });

    await pal.waitForLocation("/en/habitability/my-letters");
  });
});
