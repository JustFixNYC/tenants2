import React from "react";

import { AppTesterPal } from "../../tests/app-tester-pal";
import {
  ProgressRoutesProps,
  buildProgressRoutesComponent,
} from "../progress-routes";

const myRoutesProps: ProgressRoutesProps = {
  toLatestStep: "/boop/latest-step",
  label: "Boop",
  welcomeSteps: [{ path: "/boop/hi", exact: true, render: () => <p>HALLO</p> }],
  stepsToFillOut: [],
  confirmationSteps: [],
};

const MyRoutes = buildProgressRoutesComponent(() => myRoutesProps);

describe("ProgressRoutes", () => {
  

  it("Redirects to latest step", () => {
    const pal = new AppTesterPal(<MyRoutes />, {
      url: "/boop/latest-step",
    });
    expect(pal.history.location.pathname).toBe("/boop/hi");
    pal.rr.getByText("HALLO");
  });
});
