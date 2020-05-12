import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import HelpPage from "../help-page";

const ACTIVATE_TEXT = "Activate compatibility mode";

describe("help page", () => {
  it("shows 'activate compatibility mode' button when not in safe mode", () => {
    const pal = new AppTesterPal(<HelpPage />);

    pal.rr.getByText(ACTIVATE_TEXT);
  });

  it("does not show 'activate compatibility mode' button when in safe mode", () => {
    const pal = new AppTesterPal(<HelpPage />, {
      session: {
        isSafeModeEnabled: true,
      },
    });

    expect(() => pal.rr.getByText(ACTIVATE_TEXT)).toThrow();
  });
});
