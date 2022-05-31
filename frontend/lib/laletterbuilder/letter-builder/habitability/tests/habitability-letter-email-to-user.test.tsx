import React from "react";
import { AppTesterPal } from "../../../../tests/app-tester-pal";
import { HabitabilityLetterEmailToUserBody } from "../letter-email-to-user";
import { LaLetterBuilderLinguiI18n } from "../../../site";
import { preloadLingui } from "../../../../tests/lingui-preloader";
import { newSb } from "../../../../tests/session-builder";

beforeAll(preloadLingui(LaLetterBuilderLinguiI18n));

describe("HabitabilityLetterEmailToUserBody", () => {
  it("works with LA users", () => {
    const pal = new AppTesterPal(<HabitabilityLetterEmailToUserBody />, {
      session: newSb().withLoggedInLosAngelesUser().withMailedNorentLetter()
        .value,
    });
    expect(pal.rr.container).toMatchSnapshot();
  });

  it("works with SF users", () => {
    const pal = new AppTesterPal(<HabitabilityLetterEmailToUserBody />, {
      session: newSb().withLoggedInSanFranciscoUser().withMailedNorentLetter()
        .value,
    });
    expect(pal.rr.container).toMatchSnapshot();
  });
});
