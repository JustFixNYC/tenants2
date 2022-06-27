import React from "react";

import { LaLetterBuilderRouteComponent } from "../../routes";
import { LaLetterBuilderRouteInfo } from "../../route-info";
import { newSb } from "../../../tests/session-builder";
import { Route } from "react-router-dom";

import { AppTesterPal } from "../../../tests/app-tester-pal";

const sb = newSb();

describe("choose letter page", () => {
  it("loads", () => {
    const pal = new AppTesterPal(
      <Route component={LaLetterBuilderRouteComponent} />,
      {
        url: LaLetterBuilderRouteInfo.locale.chooseLetter,
        session: sb.value,
      }
    );
    pal.rr.getByText(/Notice to repair/i);
  });

  it("redirects to phone number with logged out user", async () => {
    const pal = new AppTesterPal(
      <Route component={LaLetterBuilderRouteComponent} />,
      {
        url: LaLetterBuilderRouteInfo.locale.chooseLetter,
        session: sb.value,
      }
    );
    pal.clickButtonOrLink("Select letter");
    await pal.rt.waitFor(() => pal.rr.getByText(/Your phone number/i));
  });

  it("redirects to habitability with logged in user", async () => {
    const pal = new AppTesterPal(
      <Route component={LaLetterBuilderRouteComponent} />,
      {
        url: LaLetterBuilderRouteInfo.locale.chooseLetter,
        session: sb.withLoggedInJustfixUser().value,
      }
    );
    pal.clickButtonOrLink("Select letter");
    await pal.rt.waitFor(() => pal.rr.getByText(/My Letters/i));
  });
});
