import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { NorentLogoutPage } from "../log-out";
import { LogoutMutation } from "../../queries/LogoutMutation";

describe("Norent logout page", () => {
  const pageWithPhoneNumber = (phoneNumber: string | null) =>
    new AppTesterPal(<NorentLogoutPage />, { session: { phoneNumber } });

  it("renders when logged in", () => {
    pageWithPhoneNumber("5551234567").rr.getByText(/log out/);
  });

  it("submits logout form", () => {
    const pal = pageWithPhoneNumber("5551234567");
    pal.clickButtonOrLink(/sign out/i);
    pal.withFormMutation(LogoutMutation).expect({});
  });
});
