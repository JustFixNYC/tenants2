import { getNoRentLetterBuilderProgressRoutesProps } from "../steps";
import { newSb } from "../../../tests/session-builder";
import { PhoneNumberAccountStatus } from "../../../queries/globalTypes";
import { overrideGlobalAppServerInfo } from "../../../tests/util";
import { initNationalMetadataForTesting } from "./national-metadata-test-util";
import { ProgressRoutesTester } from "../../../progress/tests/progress-routes-tester";

const tester = new ProgressRoutesTester(
  getNoRentLetterBuilderProgressRoutesProps(),
  "NoRent letter builder flow"
);

tester.defineSmokeTests();

const sb = newSb();

describe("NoRent letter builder steps", () => {
  beforeAll(() => overrideGlobalAppServerInfo({ siteType: "NORENT" }));
  beforeAll(initNationalMetadataForTesting);

  it("asks brand-new users for their name", () => {
    expect(
      tester.getNextSteps(
        2,
        sb.withQueriedPhoneNumber(PhoneNumberAccountStatus.NO_ACCOUNT)
      )
    ).toEqual(["/en/letter/phone/ask", "/en/letter/name"]);
  });

  it("works w/ logged-in national users in states w/ protections", () => {
    expect(tester.getNextSteps(2, sb.withLoggedInNationalUser())).toEqual([
      "/en/letter/kyr",
      "/en/letter/landlord/name",
    ]);
  });

  it("works w/ logged-in national users in states w/o protections", () => {
    expect(
      tester.getNextSteps(
        2,
        sb.withLoggedInNationalUser().withOnboardingInfo({
          state: "GA",
        })
      )
    ).toEqual(["/en/letter/kyr", "/en/letter/post-signup-no-protections"]);
  });

  it("works w/ logged-in JustFix.nyc user who hasn't yet agreed to terms", () => {
    expect(tester.getNextSteps(3, sb.withLoggedInJustfixUser())).toEqual([
      "/en/letter/terms",
      "/en/letter/kyr",
      "/en/letter/landlord/name",
    ]);
  });
});
