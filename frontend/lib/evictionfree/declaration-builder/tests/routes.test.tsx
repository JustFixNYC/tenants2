import { ProgressRoutesTester } from "../../../progress/tests/progress-routes-tester";
import { PhoneNumberAccountStatus } from "../../../queries/globalTypes";
import { newSb } from "../../../tests/session-builder";
import { getEvictionFreeDeclarationBuilderProgressRoutesProps } from "../routes";

const tester = new ProgressRoutesTester(
  getEvictionFreeDeclarationBuilderProgressRoutesProps(),
  "Eviction free declaration builder flow",
  { server: { siteType: "EVICTIONFREE" } }
);

tester.defineSmokeTests();

const sb = newSb();

describe("Eviction free declaration builder steps", () => {
  tester.defineTest({
    it: "takes brand-new users through onboarding",
    usingSession: sb
      .withQueriedPhoneNumber(PhoneNumberAccountStatus.NO_ACCOUNT)
      .withNorentScaffolding({
        city: "Albany",
        state: "NY",
      }),
    expectSteps: [
      "/en/declaration/phone/ask",
      "/en/declaration/name",
      "/en/declaration/city",
      "/en/declaration/address/national",
      "/en/declaration/create-account",
    ],
  });
});
