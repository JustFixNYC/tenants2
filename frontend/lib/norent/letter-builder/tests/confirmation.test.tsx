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
    expect(pal.rr.getByText("Sign the petition").getAttribute("href")).toBe(
      CANCEL_RENT_PETITION_URL
    );
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
    pal.rr.getByText(/California has specific documentation/i);
    pal.rr.getByText("Find out more");
    pal.rr.getByText("7 days");
  });
});
