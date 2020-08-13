import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { NycUsersOnly } from "../nyc-users-only";
import { newSb } from "../../tests/session-builder";

describe("<NycUsersOnly>", () => {
  it("apologizes to non-NYC users", () => {
    const pal = new AppTesterPal(
      (
        <NycUsersOnly>
          <p>BOOP</p>
        </NycUsersOnly>
      ),
      {
        session: newSb().withLoggedInNationalUser().value,
      }
    );
    pal.rr.getByText(/Sorry/i);
  });

  it("shows children to NYC users", () => {
    const pal = new AppTesterPal(
      (
        <NycUsersOnly>
          <p>BOOP</p>
        </NycUsersOnly>
      ),
      {
        session: newSb().withLoggedInJustfixUser().value,
      }
    );
    pal.rr.getByText(/BOOP/i);
  });
});
