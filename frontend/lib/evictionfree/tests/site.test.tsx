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

  it("renders regular home page when EvictionFree is active", async () => {
    const pal = new AppTesterPal(route, { url: "/en/" });
    await waitFor(() =>
      pal.rr.getByText(
        /You can use this website to send a hardship declaration/i
      )
    );
  });

  it("renders special text on home page when EvictionFree is suspended", async () => {
    const pal = new AppTesterPal(route, {
      url: "/en/",
      server: { isEfnySuspended: true },
    });
    await waitFor(() => pal.rr.getByText(/no longer protected/i));
  });
});
