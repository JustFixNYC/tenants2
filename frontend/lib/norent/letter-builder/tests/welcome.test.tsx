import React from "react";

import { AppTesterPal } from "../../../tests/app-tester-pal";
import { NorentRoutes } from "../../routes";
import { NorentLetterBuilderRoutes } from "../steps";

describe("NoRent welcome page", () => {
  const createPal = (phoneNumber?: string) => {
    return new AppTesterPal(<NorentLetterBuilderRoutes />, {
      url: NorentRoutes.locale.letter.welcome,
      session: {
        phoneNumber: phoneNumber,
      },
    });
  };

  it("should work", async () => {
    const pal = createPal();
    pal.rr.getByText("Build your letter");
    pal.clickButtonOrLink("Next");
    await pal.waitForLocation(NorentRoutes.locale.letter.phoneNumber);
  });

  it("should show special welcome message for logged-in users", () => {
    const pal = createPal("1234567890");
    pal.rr.getByText("Welcome back!");
  });
});
