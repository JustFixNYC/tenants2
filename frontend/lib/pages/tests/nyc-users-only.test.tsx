import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { NycUsersOnly } from "../nyc-users-only";
import { newSb } from "../../tests/session-builder";
import { Switch, Route } from "react-router-dom";
import { createFakeLoginRoute } from "../../tests/util";

const EL = (
  <Switch>
    <Route
      path="/"
      exact
      render={() => (
        <NycUsersOnly>
          <p>BOOP</p>
        </NycUsersOnly>
      )}
    />
    {createFakeLoginRoute()}
  </Switch>
);

describe("<NycUsersOnly>", () => {
  it("redirects logged-out users to login", () => {
    const pal = new AppTesterPal(EL);
    pal.rr.getByText("at login, search is ?next=%2F");
  });

  it("apologizes to non-NYC users", () => {
    const pal = new AppTesterPal(EL, {
      session: newSb().withLoggedInNationalUser().value,
    });
    pal.rr.getByText(/Sorry/i);
  });

  it("shows children to NYC users", () => {
    const pal = new AppTesterPal(EL, {
      session: newSb().withLoggedInJustfixUser().value,
    });
    pal.rr.getByText(/BOOP/i);
  });
});
