import {
  assertIsUSState,
  getNorentMetadataForUSState,
  CovidStateLawVersion,
  isLoggedInUserInStateWithProtections,
} from "../national-metadata";
import { USStateChoices } from "../../../../../common-data/us-state-choices";
import { override } from "../../../tests/util";
import { BlankOnboardingInfo } from "../../../queries/OnboardingInfo";
import { BlankAllSessionInfo } from "../../../queries/AllSessionInfo";
import { initNationalMetadataForTesting } from "./national-metadata-test-util";

beforeAll(initNationalMetadataForTesting);

test("isLoggedInUserInStateWithProtections() works", () => {
  const onboardingInfo = override(BlankOnboardingInfo, { state: "NY" });
  const session = override(BlankAllSessionInfo, { onboardingInfo });
  expect(isLoggedInUserInStateWithProtections(session)).toBe(true);

  onboardingInfo.state = "";
  expect(isLoggedInUserInStateWithProtections(session)).toBe(true);

  onboardingInfo.state = "GA";
  expect(isLoggedInUserInStateWithProtections(session)).toBe(false);
});

describe("assertIsUSState", () => {
  it("works w/ states", () => {
    expect(assertIsUSState("NY")).toBe("NY");
  });

  it("throws error on non-states", () => {
    expect(() => assertIsUSState("ZZ")).toThrowError(
      "ZZ is not a valid two-letter US state!"
    );
  });
});

function validateCovidStateLawVersion(v: CovidStateLawVersion): boolean {
  switch (v) {
    case CovidStateLawVersion.V1_NON_PAYMENT:
      return true;
    case CovidStateLawVersion.V2_HARDSHIP:
      return true;
    case CovidStateLawVersion.V3_FEW_PROTECTIONS:
      return true;
  }

  throw new Error(`Invalid CovidStateLawVersion: ${v}`);
}

describe("getNorentMetadataForUSState()", () => {
  USStateChoices.forEach((state) => {
    it(`matches our assumptions about the data for ${state}`, () => {
      const md = getNorentMetadataForUSState(state);
      expect(typeof md.lawForBuilder.stateWithoutProtections).toBe("boolean");
      expect(typeof md.lawForBuilder.linkToLegislation).toMatch(
        /string|undefined/
      );
      expect(typeof md.lawForBuilder.textOfLegislation).toMatch(
        /string|undefined/
      );
      if (!md.lawForBuilder.stateWithoutProtections) {
        expect(typeof md.lawForBuilder.textOfLegislation).toBe("string");
        expect(md.lawForLetter.textOfLegislation.length).toBeGreaterThan(0);
      }
      validateCovidStateLawVersion(md.lawForLetter.whichVersion);
      expect(typeof md.partner).toMatch(/object|undefined/);
      if (typeof md.partner === "object") {
        expect(typeof md.partner.organizationName).toBe("string");
        expect(typeof md.partner.organizationWebsiteLink).toBe("string");
      }
      expect(
        typeof md.docs.doesTheTenantNeedToSendTheDocumentationToTheLandlord
      ).toBe("boolean");
      expect(typeof md.docs.isDocumentationALegalRequirement).toBe("boolean");
      expect(
        typeof md.docs.numberOfDaysFromNonPaymentNoticeToProvideDocumentation
      ).toMatch(/number|undefined/);
      expect(typeof md.legalAid.localLegalAidProviderLink).toBe("string");
    });
  });
});
