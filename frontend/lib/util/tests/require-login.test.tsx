import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { RequireLogin } from "../require-login";
import { Switch, Route } from "react-router-dom";
import { newSb } from "../../tests/session-builder";
import { createFakeLoginRoute } from "../../tests/util";

const EL = (
  <Switch>
    {createFakeLoginRoute()}
    <Route
      path="/boop"
      exact
      render={() => (
        <RequireLogin>
          <p>at boop</p>
        </RequireLogin>
      )}
    />
  </Switch>
);

describe("RequireLogin", () => {
  it("renders children if user is already logged in", () => {
    const pal = new AppTesterPal(EL, {
      url: "/boop",
      session: newSb().withLoggedInUser().value,
    });
    pal.rr.getByText("at boop");
  });

  it("redirects to login if user is not logged in", () => {
    const pal = new AppTesterPal(EL, {
      url: "/boop",
    });
    pal.rr.getByText("at login, search is ?next=%2Fboop");
  });
});
