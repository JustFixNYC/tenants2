import { ProgressRoutesTester } from "../../../progress/tests/progress-routes-tester";
import { PhoneNumberAccountStatus } from "../../../queries/globalTypes";
import { newSb } from "../../../tests/session-builder";
import { getLALetterBuilderProgressRoutesProps } from "../routes";

const tester = new ProgressRoutesTester(
  getLALetterBuilderProgressRoutesProps(),
  "LA Letter builder flow",
  { server: { siteType: "LALETTERBUILDER" } }
);

tester.defineSmokeTests();

const sb = newSb();

describe("LA Letter Builder steps", () => {
  tester.defineTest({
    it: "takes brand-new users through onboarding",
    usingSession: sb
      .withQueriedPhoneNumber(PhoneNumberAccountStatus.NO_ACCOUNT)
      .withNorentScaffolding({
        city: "Los Angeles",
        state: "CA",
      }),
    expectSteps: [
      "/en/letter/phone/ask",
      "/en/letter/name",
      "/en/letter/city",
      "/en/letter/address/national",
      "/en/letter/create-account",
    ],
  });
});
