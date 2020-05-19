import { AppTesterPal } from "../../../tests/app-tester-pal";
import { NorentConfirmation, CANCEL_RENT_PETITION_URL } from "../confirmation";
import { createProgressStepJSX } from "../../../progress/tests/progress-step-test-util";
import { override } from "../../../tests/util";
import { initNationalMetadataForTesting } from "./national-metadata-test-util";
import { BlankOnboardingInfo } from "../../../queries/OnboardingInfo";

beforeAll(initNationalMetadataForTesting);

describe("NoRent confirmation page", () => {
  const createPal = (state: string, trackingNumber?: string) => {
    return new AppTesterPal(createProgressStepJSX(NorentConfirmation), {
      session: {
        phoneNumber: "1234567890",
        onboardingInfo: override(BlankOnboardingInfo, {
          state,
        }),
        norentLatestLetter: trackingNumber
          ? {
              trackingNumber: trackingNumber,
              letterSentAt: null,
              paymentDate: "Boop 1st, 2099",
            }
          : null,
      },
    });
  };

  it("should work", () => {
    const pal = createPal("NY", "1234Boopy");
    pal.rr.getByText("You've sent your letter");
    pal.ensureLinkGoesTo("Sign the petition", CANCEL_RENT_PETITION_URL);
  });

  it("should work for users sending physical letters", () => {
    const pal = createPal("NY", "1234Boopy");
    pal.rr.getByText(/mailed to your landlord via USPS/i);
    pal.rr.getByText(/USPS Tracking #:/i);
  });

  it("should work for users who only emailed letter", () => {
    const pal = createPal("NY");
    pal.rr.getByText(/sent to your landlord via email/i);
  });

  it("renders full state documentation requirements", () => {
    const pal = createPal("CA");
    pal.rr.getByText(/has specific documentation/i);
    pal.rr.getByText("Find out more");
    pal.rr.getByText(/days/i, { selector: "span" });
  });

  it("renders state-specific legal aid link", () => {
    const pal = createPal("AK");
    pal.ensureLinkGoesTo(
      "your local legal aid provider",
      "https://alaskalawhelp.org/"
    );
  });
});
