import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { Route } from "react-router-dom";
import { waitFor } from "@testing-library/react";
import EvictionFreeSite from "../site";

describe("EvictionFreeSite", () => {
  const route = <Route render={(props) => <EvictionFreeSite {...props} />} />;

  it("renders 404 page", () => {
    const pal = new AppTesterPal(route, { url: "/blarg" });
    waitFor(() => pal.rr.getByText(/doesn't seem to exist/i));
  });

  it("renders home page", () => {
    const pal = new AppTesterPal(route, { url: "/en/" });
    waitFor(() =>
      pal.rr.getByText(/This is a test localization message for EvictionFree/i)
    );
  });
});
