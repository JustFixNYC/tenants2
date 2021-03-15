import { newSb } from "../../tests/session-builder";
import { assertNotNull } from "../../util/util";
import { efnyDeclarationEmailToHousingCourtForTesting } from "../declaration-email-to-housing-court";
import { sessionToEvictionFreeDeclarationEmailProps } from "../declaration-email-utils";

const { emailSubject } = efnyDeclarationEmailToHousingCourtForTesting;

const sb = newSb()
  .withLoggedInEvictionFreeUser()
  .withLandlordDetails()
  .withSubmittedHardshipDeclaration();

const outsideNycSb = sb.withOnboardingInfo({
  city: "Buffalo",
  borough: null,
  county: "Erie",
});

function getSubject(builder: typeof sb) {
  return emailSubject(
    assertNotNull(sessionToEvictionFreeDeclarationEmailProps(builder.value))
  );
}

describe("emailSubject()", () => {
  it("works for NYC users", () => {
    expect(getSubject(sb)).toMatch(
      /^Hardship Declaration - Boop Jones - submitted /i
    );
  });

  it("works for outside-NYC users", () => {
    expect(getSubject(outsideNycSb)).toBe(
      "Boop Jones - 150 Court St, Buffalo, NY 11201 - Erie County"
    );
  });

  it("works for outside-NYC users w/ index # and housing court", () => {
    expect(
      getSubject(
        outsideNycSb.withHardshipDeclarationDetails({
          indexNumber: "94568-2019",
          courtName: "Funky Town Court",
        })
      )
    ).toBe(
      "Boop Jones - 150 Court St, Buffalo, NY 11201 - No. 94568-2019 - Funky Town Court - Erie County"
    );
  });
});
