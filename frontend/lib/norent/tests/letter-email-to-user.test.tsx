import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { NorentLetterEmailToUser } from "../letter-email-to-user";
import { NorentLinguiI18n } from "../site";
import { preloadLingui } from "../../tests/lingui-preloader";

beforeAll(preloadLingui(NorentLinguiI18n));

describe("NorentLetterEmailToUser", () => {
  it("works", () => {
    const pal = new AppTesterPal(<NorentLetterEmailToUser />, {
      session: {
        firstName: "Boop",
        norentLatestLetter: {
          trackingNumber: "1234567890987654321",
          letterSentAt: null,
          createdAt: "2020-03-13T19:41:09+00:00",
        },
      },
    });
    expect(pal.rr.container).toMatchSnapshot();
  });
});
