import React from "react";
import { LogoutPage } from "../logout-page";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { LogoutMutation } from "../../queries/LogoutMutation";

describe("logout page", () => {
  const pageWithPhoneNumber = (phoneNumber: string | null) =>
    new AppTesterPal(<LogoutPage />, { session: { phoneNumber } });

  it("renders when logged out", () => {
    pageWithPhoneNumber(null).rr.getByText(/You are now signed out/);
  });

  it("submits logout form", () => {
    const pal = pageWithPhoneNumber("5551234567");
    pal.rr.getByText(/Are you sure/);
    pal.clickButtonOrLink(/sign out/i);
    pal.withFormMutation(LogoutMutation).expect({});
  });
});
