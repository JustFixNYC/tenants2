import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { Route } from "react-router-dom";
import { waitFor } from "@testing-library/react";
import EvictionFreeSite from "../site";

describe("EvictionFreeSite", () => {
  const route = <Route render={(props) => <EvictionFreeSite {...props} />} />;

  it("renders 404 page", async () => {
    const pal = new AppTesterPal(route, { url: "/blarg" });
    await waitFor(() => pal.rr.getByText(/doesn't seem to exist/i));
  });

  it("renders home page", async () => {
    const pal = new AppTesterPal(route, { url: "/en/" });
    await waitFor(() =>
      pal.rr.getByText(/take action today to protect and expand them/i)
    );
  });
});
