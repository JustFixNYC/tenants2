import { ProgressRoutesTester } from "../../../../progress/tests/progress-routes-tester";
import { newSb } from "../../../../tests/session-builder";
import { PhoneNumberAccountStatus } from "../../../../queries/globalTypes";
import { getHabitabilityProgressRoutesProps } from "../routes";

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
    startingAtStep: "/en/habitability/phone/ask",
    expectSteps: [
      "/en/habitability/name",
      "/en/habitability/city",
      "/en/habitability/address/national",
      "/en/habitability/consent",
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
  startingAtStep: "/en/habitability/create-account",
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
