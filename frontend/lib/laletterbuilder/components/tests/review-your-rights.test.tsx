import React from "react";

import { AppTesterPal } from "../../../tests/app-tester-pal";
import { LaLetterBuilderRouteInfo } from "../../route-info";
import { newSb } from "../../../tests/session-builder";
import HabitabilityRoutes from "../../letter-builder/habitability/routes";

const sb = newSb();

describe("review your rights page", () => {
  it("loads", async () => {
    const pal = new AppTesterPal(<HabitabilityRoutes />, {
      url: LaLetterBuilderRouteInfo.locale.habitability.reviewRights, // TODO: generalize to all letter types
      session: sb.value,
    });
    pal.rr.getByText(/Review your rights as a tenant/i);
    pal.rr.getByText(/Back/);
    pal.rr.getByText(/Next/);
  });
});
