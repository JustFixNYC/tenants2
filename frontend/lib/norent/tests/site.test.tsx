import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import NorentSite from "../site";
import { Route } from "react-router-dom";

describe("NorentSite", () => {
  const route = <Route render={(props) => <NorentSite {...props} />} />;

  afterEach(AppTesterPal.cleanup);

  it("renders 404 page", () => {
    const pal = new AppTesterPal(route, { url: "/blarg" });
    pal.rr.getByText(/doesn't seem to exist/i);
  });

  it("renders home page", () => {
    const pal = new AppTesterPal(route, { url: "/en/" });
    pal.rr.getByText(/Can't pay rent/i);
  });
});
