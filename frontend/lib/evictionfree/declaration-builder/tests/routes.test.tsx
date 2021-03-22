import { ProgressRoutesTester } from "../../../progress/tests/progress-routes-tester";
import { PhoneNumberAccountStatus } from "../../../queries/globalTypes";
import { AppTesterPal } from "../../../tests/app-tester-pal";
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
      "/en/declaration/email",
      "/en/declaration/create-account",
    ],
  });
});

tester.defineTest({
  it: "takes onboarded users through flow to confirmation",
  usingSession: sb
    .withLoggedInNationalUser()
    .withOnboardingInfo({
      state: "NY",
    })
    .withNorentScaffolding({
      hasLandlordEmailAddress: true,
      hasLandlordMailingAddress: true,
    }),
  startingAtStep: "/en/declaration/create-account",
  expectSteps: [
    "/en/declaration/hardship-situation",
    "/en/declaration/index-number",
    "/en/declaration/landlord/name",
    "/en/declaration/landlord/email",
    "/en/declaration/landlord/address",
    "/en/declaration/agree",
    "/en/declaration/preview",
    "/en/declaration/confirmation",
  ],
});

tester.defineTest({
  it: "works w/ logged-in JustFix.nyc user who hasn't yet agreed to terms",
  usingSession: sb.withLoggedInJustfixUser(),
  expectSteps: ["/en/declaration/terms", "/en/declaration/hardship-situation"],
});

tester.defineTest({
  it: "works w/ logged-in users who are outside NY",
  usingSession: sb.withLoggedInLosAngelesUser().withOnboardingInfo({
    agreedToEvictionfreeTerms: true,
  }),
  expectSteps: ["/en/declaration/outside-ny"],
});

tester.defineTest({
  it: "works w/ logged-in user who doesn't have email set",
  usingSession: sb.withLoggedInEvictionFreeUser().with({ email: "" }),
  expectSteps: ["/en/declaration/email", "/en/declaration/hardship-situation"],
});

test("it takes users who have already sent a declaration straight to confirmation", async () => {
  const pal = new AppTesterPal(tester.render(), {
    ...tester.appTesterPalOptions,
    url: "/en/declaration",
    session: sb
      .withLoggedInEvictionFreeUser()
      .withSubmittedHardshipDeclaration().value,
  });
  await pal.waitForLocation("/en/declaration/confirmation");
});
