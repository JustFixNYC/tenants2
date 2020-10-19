import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { NorentLetterEmailToUserBody } from "../letter-email-to-user";
import { NorentLinguiI18n } from "../site";
import { preloadLingui } from "../../tests/lingui-preloader";
import { newSb } from "../../tests/session-builder";

beforeAll(preloadLingui(NorentLinguiI18n));

describe("NorentLetterEmailToUserBody", () => {
  it("works with LA users", () => {
    const pal = new AppTesterPal(<NorentLetterEmailToUserBody />, {
      session: newSb().withLoggedInLosAngelesUser().withMailedNorentLetter()
        .value,
    });
    expect(pal.rr.container).toMatchSnapshot();
  });

  it("works with SF users", () => {
    const pal = new AppTesterPal(<NorentLetterEmailToUserBody />, {
      session: newSb().withLoggedInSanFranciscoUser().withMailedNorentLetter()
        .value,
    });
    expect(pal.rr.container).toMatchSnapshot();
  });

  it("works with NJ users", () => {
    const pal = new AppTesterPal(<NorentLetterEmailToUserBody />, {
      session: newSb().withLoggedInNewJerseyUser().withMailedNorentLetter()
        .value,
    });
    expect(pal.rr.container).toMatchSnapshot();
  });
});
