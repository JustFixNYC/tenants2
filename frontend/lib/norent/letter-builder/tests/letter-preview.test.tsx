import { AppTesterPal } from "../../../tests/app-tester-pal";
import { createProgressStepJSX } from "../../../progress/tests/progress-step-test-util";
import { override } from "../../../tests/util";
import { BlankLandlordDetailsType } from "../../../queries/LandlordDetailsType";
import { NorentLetterPreviewPage } from "../letter-preview";

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

  it("should work", () => {
    const pal = createPal("landlordo@gmail.com", "123 Boop Lane");
    pal.rr.getByText(/let's review what will be sent/i);
    pal.rr.getByText(/will be mailing this letter/i);
    pal.rr.getByText(/Here’s a preview of the email/i);
  });

  it("renders specific text for user emailing letter", () => {
    const pal = createPal("landlordo@gmail.com");
    pal.rr.getByText(/Here’s a preview of the email/i);
    pal.rr.getByText(/will be attached in an email to your landlord/i);
    expect(pal.rr.queryByText(/will be mailing this letter/i)).toBe(null);
  });

  it("renders specific text for user mailing letter", () => {
    const pal = createPal(undefined, "123 Boop Lane");
    pal.rr.getByText(/will be mailing this letter/i);
    expect(pal.rr.queryByText(/Here’s a preview of the email/i)).toBe(null);
  });

  it("omits email-specific message if user is also mailing letter", () => {
    const pal = createPal("landlordo@gmail.com", "123 Boop Lane");
    expect(
      pal.rr.queryByText(/will be attached in an email to your landlord/i)
    ).toBe(null);
  });
});
