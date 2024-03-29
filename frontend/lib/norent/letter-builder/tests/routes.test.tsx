import { getNoRentLetterBuilderProgressRoutesProps } from "../routes";
import { newSb } from "../../../tests/session-builder";
import { PhoneNumberAccountStatus } from "../../../queries/globalTypes";
import { initNationalMetadataForTesting } from "./national-metadata-test-util";
import { ProgressRoutesTester } from "../../../progress/tests/progress-routes-tester";
import { AppTesterPal } from "../../../tests/app-tester-pal";

const tester = new ProgressRoutesTester(
  getNoRentLetterBuilderProgressRoutesProps(),
  "NoRent letter builder flow",
  { server: { siteType: "NORENT" } }
);

tester.defineSmokeTests();

const sb = newSb();

describe("NoRent letter builder steps", () => {
  beforeAll(initNationalMetadataForTesting);

  tester.defineTest({
    it: "takes brand-new users through onboarding",
    usingSession: sb
      .withQueriedPhoneNumber(PhoneNumberAccountStatus.NO_ACCOUNT)
      .withOnboardingScaffolding({
        city: "Louisville",
        state: "KY",
      }),
    expectSteps: [
      "/en/letter/phone/ask",
      "/en/letter/name",
      "/en/letter/city",
      "/en/letter/kyr",
      "/en/letter/address/national",
      "/en/letter/email",
      "/en/letter/create-account",
    ],
  });

  tester.defineTest({
    it: "takes onboarding LA users through LA modal",
    usingSession: sb.withOnboardingScaffolding({
      city: "Los Angeles",
      state: "CA",
      zipCode: "90210",
      isInLosAngeles: true,
    }),
    startingAtStep: "/en/letter/kyr",
    expectSteps: [
      "/en/letter/address/national",
      "/en/letter/address/los-angeles",
      "/en/letter/email",
      "/en/letter/create-account",
    ],
  });

  tester.defineTest({
    it: "takes onboarding NYC users through NYC address input",
    usingSession: sb.withOnboardingScaffolding({
      city: "Brooklyn",
      state: "NY",
      isCityInNyc: true,
    }),
    startingAtStep: "/en/letter/kyr",
    expectSteps: [
      "/en/letter/address/nyc",
      "/en/letter/email",
      "/en/letter/create-account",
    ],
  });

  tester.defineTest({
    it: "works w/ logged-in national users in states w/ protections",
    usingSession: sb.withLoggedInNationalUser().withOnboardingInfo({
      canReceiveRttcComms: null,
    }),
    expectSteps: [
      {
        url: "/en/letter/kyr",
        test: (pal) =>
          pal.rr.getByText(/additional support once you’ve sent your letter/),
      },
      "/en/letter/landlord/name",
    ],
  });

  tester.defineTest({
    it: "works w/ logged-in national users in states w/o protections",
    usingSession: sb.withLoggedInNationalUser().withOnboardingInfo({
      state: "GA",
      canReceiveRttcComms: null,
    }),
    expectSteps: [
      {
        url: "/en/letter/kyr",
        test: (pal) => pal.rr.getByText(/we do not currently recommend/i),
      },
      "/en/letter/post-signup-no-protections",
    ],
  });

  tester.defineTest({
    it: "works w/ logged-in JustFix user who hasn't yet agreed to terms",
    usingSession: sb.withLoggedInJustfixUser(),
    expectSteps: [
      "/en/letter/terms",
      "/en/letter/kyr",
      "/en/letter/post-signup-no-protections",
    ],
  });

  tester.defineTest({
    it: "works w/ logged-in JustFix user who doesn't have email set",
    usingSession: sb.withLoggedInJustfixUser().with({ email: "" }),
    expectSteps: [
      "/en/letter/terms",
      "/en/letter/kyr",
      "/en/letter/email",
      "/en/letter/post-signup-no-protections",
    ],
  });

  tester.defineTest({
    it: "Asks legacy LA users to opt-in to SAJE",
    usingSession: sb.withLoggedInLosAngelesUser().withOnboardingInfo({
      canReceiveSajeComms: null,
    }),
    expectSteps: ["/en/letter/address/los-angeles"],
  });

  tester.defineTest({
    it: "Skips SAJE opt-in for users who have already seen it",
    usingSession: sb.withLoggedInLosAngelesUser().withOnboardingInfo({
      canReceiveSajeComms: false,
    }),
    expectSteps: ["/en/letter/landlord/name"],
  });

  tester.defineTest({
    it: "takes onboarded users through flow to confirmation",
    usingSession: sb.withLoggedInNationalUser().withOnboardingScaffolding({
      hasLandlordEmailAddress: true,
      hasLandlordMailingAddress: true,
    }),
    startingAtStep: "/en/letter/create-account",
    expectSteps: [
      "/en/letter/landlord/name",
      "/en/letter/landlord/email",
      "/en/letter/landlord/address",
      "/en/letter/rent-periods",
      "/en/letter/rent-periods/select-months",
      "/en/letter/preview",
      "/en/letter/confirmation",
    ],
  });

  it("takes users who have sent letters but can send more to menu", async () => {
    const pal = new AppTesterPal(tester.render(), {
      ...tester.appTesterPalOptions,
      url: "/en/letter",
      session: sb
        .withLoggedInNationalUser()
        .withMailedNorentLetter()
        .withAvailableNoRentPeriods().value,
    });
    await pal.waitForLocation("/en/letter/menu");
  });

  it("takes users who have sent letters for all rent periods straight to confirmation", async () => {
    const pal = new AppTesterPal(tester.render(), {
      ...tester.appTesterPalOptions,
      url: "/en/letter",
      session: sb.withLoggedInNationalUser().withMailedNorentLetter().value,
    });
    await pal.waitForLocation("/en/letter/confirmation");
  });
});
