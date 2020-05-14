import { AppTesterPal } from "../../../tests/app-tester-pal";
import { createProgressStepJSX } from "../../../progress/tests/progress-step-test-util";
import { override } from "../../../tests/util";
import { BlankLandlordDetailsType } from "../../../queries/LandlordDetailsType";
import { NorentLetterPreviewPage } from "../letter-preview";
import { NorentRoutes } from "../../routes";

describe("NoRent letter preview page", () => {
  const createPal = (email?: string, address?: string) => {
    return new AppTesterPal(createProgressStepJSX(NorentLetterPreviewPage), {
      session: {
        phoneNumber: "1234567890",
        landlordDetails: override(BlankLandlordDetailsType, {
          email,
          address,
        }),
      },
    });
  };

  const checkLinkToLetterPdf = (pal: AppTesterPal) =>
    pal.ensureLinkGoesTo(
      "View this letter as a PDF",
      NorentRoutes.locale.letterContent.pdf
    );

  const checkEmbedOfLetterPreview = (pal: AppTesterPal) => {
    const iframe = pal.rr.getByTitle("Preview of your NoRent.org letter");
    expect(iframe.tagName).toBe("IFRAME");
  };

  it("should work", () => {
    const pal = createPal("landlordo@gmail.com", "123 Boop Lane");
    pal.rr.getByText(/let's review what will be sent/i);
    pal.rr.getByText(/will be mailing this letter/i);
    pal.rr.getByText(/Here’s a preview of the email/i);
    checkLinkToLetterPdf(pal);
    checkEmbedOfLetterPreview(pal);
  });

  it("renders specific content for user emailing letter", () => {
    const pal = createPal("landlordo@gmail.com");
    pal.rr.getByText(/Here’s a preview of the email/i);
    pal.rr.getByText(/will be attached in an email to your landlord/i);
    expect(pal.rr.queryByText(/will be mailing this letter/i)).toBe(null);
    checkLinkToLetterPdf(pal);
  });

  it("renders specific content for user mailing letter", () => {
    const pal = createPal(undefined, "123 Boop Lane");
    pal.rr.getByText(/will be mailing this letter/i);
    expect(pal.rr.queryByText(/Here’s a preview of the email/i)).toBe(null);
    checkLinkToLetterPdf(pal);
    checkEmbedOfLetterPreview(pal);
  });

  it("omits email-specific message if user is also mailing letter", () => {
    const pal = createPal("landlordo@gmail.com", "123 Boop Lane");
    expect(
      pal.rr.queryByText(/will be attached in an email to your landlord/i)
    ).toBe(null);
  });
});
