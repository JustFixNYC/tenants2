import { assertIsUSState, getNorentMetadataForUSState } from "../national-metadata";
import { USStateChoices } from "../../../../../common-data/us-state-choices";

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

describe("getNorentMetadataForUSState()", () => {
  USStateChoices.forEach(state => {
    it(`matches our assumptions about the data for ${state}`, () => {
      const md = getNorentMetadataForUSState(state);
      expect(typeof(md.lawForBuilder.linkToLegislation)).toBe('string');
      expect(typeof(md.lawForBuilder.textOfLegislation)).toBe('string');
      expect(typeof(md.lawForLetter.textOfLegislation1)).toBe('string');
      expect(typeof(md.lawForLetter.textOfLegislation2)).toBe('string');
      expect(typeof(md.partner.organizationName)).toBe('string');
      expect(typeof(md.partner.organizationWebsiteLink)).toBe('string');
      expect(typeof(md.docs.doesTheTenantNeedToSendTheDocumentationToTheLandlord)).toBe('boolean');
      expect(typeof(md.docs.isDocumentationALegalRequirement)).toBe('boolean');
      expect(typeof(md.docs.numberOfDaysFromNonPaymentNoticeToProvideDocumentation)).toMatch(/number|undefined/);
      expect(typeof(md.legalAid.localLegalAidProviderLink)).toBe('string');
    });
  });
});
