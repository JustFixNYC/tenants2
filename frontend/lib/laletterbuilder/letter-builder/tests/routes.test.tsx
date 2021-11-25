import { getLALetterBuilderProgressRoutesProps } from "../routes";
import { ProgressRoutesTester } from "../../../progress/tests/progress-routes-tester";
import { newSb } from "../../../tests/session-builder";
import { PhoneNumberAccountStatus } from "../../../queries/globalTypes";

const tester = new ProgressRoutesTester(
  getLALetterBuilderProgressRoutesProps(),
  "LA letter builder flow",
  { server: { siteType: "LALETTERBUILDER" } }
);

tester.defineSmokeTests();

const sb = newSb();

describe("LA letter builder steps", () => {
  tester.defineTest({
    it: "takes brand-new users through onboarding",
    usingSession: sb
      .withQueriedPhoneNumber(PhoneNumberAccountStatus.NO_ACCOUNT)
      .withOnboardingScaffolding({
        city: "Los Angeles",
        state: "CA",
      }),
    expectSteps: [
      "/en/letter/phone/ask",
      "/en/letter/name",
      "/en/letter/city",
      "/en/letter/address/national",
    ],
  });
});
