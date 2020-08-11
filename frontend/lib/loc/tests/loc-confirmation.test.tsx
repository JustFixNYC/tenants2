import React from "react";
import JustfixRoutes from "../../justfix-routes";
import { LetterRequestMailChoice } from "../../queries/globalTypes";
import { AppTesterPal } from "../../tests/app-tester-pal";
import LetterOfComplaintRoutes from "../letter-of-complaint";

describe("letter of complaint confirmation", () => {
  const createPal = (
    mailChoice: LetterRequestMailChoice,
    trackingNumber: string = ""
  ) =>
    new AppTesterPal(<LetterOfComplaintRoutes />, {
      url: JustfixRoutes.locale.loc.confirmation,
      session: {
        phoneNumber: "5551234567",
        letterRequest: {
          updatedAt: "2018-09-14T01:42:12.829983+00:00",
          mailChoice,
          trackingNumber,
          letterSentAt: trackingNumber
            ? "2018-09-15T01:42:12.829983+00:00"
            : null,
        },
      },
    });

  it("mentions date of sending when we already mailed", async () => {
    const pal = createPal(LetterRequestMailChoice.WE_WILL_MAIL, "1234");

    pal.rr.getByText(/Friday, September 14, 2018/i);
  });

  it("mentions date of reception when we will mail", async () => {
    const pal = createPal(LetterRequestMailChoice.WE_WILL_MAIL);

    pal.rr.getByText(/Thursday, September 13, 2018/i);
  });

  it("tells user to print it out and mail it", async () => {
    const pal = createPal(LetterRequestMailChoice.USER_WILL_MAIL);

    pal.rr.getByText(/print out/i);
  });
});
