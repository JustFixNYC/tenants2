import React from "react";
import { Route } from "react-router-dom";

import { waitFor } from "@testing-library/react";

import { AppTesterPal } from "../../tests/app-tester-pal";
import LaLetterBuilderSite from "../site";

describe("LaLetterBuilderSite", () => {
  const route = (
    <Route render={(props) => <LaLetterBuilderSite {...props} />} />
  );

  it("renders 404 page", async () => {
    const pal = new AppTesterPal(route, { url: "/blarg" });
    await waitFor(() => pal.rr.getByText(/doesn't seem to exist/i));
  });

  it("renders home page", async () => {
    const pal = new AppTesterPal(route, { url: "/en/" });
    await waitFor(() =>
      pal.rr.getAllByText(
        /As a California resident, you have a right to safe housing/i
      )
    );
  });
});
