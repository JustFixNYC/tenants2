import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import NorentSite from "../site";
import { Route } from "react-router-dom";
import { waitFor } from "@testing-library/react";

describe("NorentSite", () => {
  const route = <Route render={(props) => <NorentSite {...props} />} />;

  it("renders 404 page", async () => {
    const pal = new AppTesterPal(route, { url: "/blarg" });
    await waitFor(() => pal.rr.getByText(/doesn't seem to exist/i));
  });

  it("renders home page", async () => {
    const pal = new AppTesterPal(route, { url: "/en/" });
    await waitFor(() => pal.rr.getByText(/Can't pay rent/i));
  });
});
