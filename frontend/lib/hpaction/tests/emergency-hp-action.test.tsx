import React from "react";
import { ProgressRoutesTester } from "../../progress/tests/progress-routes-tester";
import { getEmergencyHPActionProgressRoutesProps } from "../emergency-hp-action";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { ProgressRoutes } from "../../progress/progress-routes";
import JustfixRoutes from "../../justfix-routes";
import { newSb } from "../../tests/session-builder";

const sb = newSb().withLoggedInJustfixUser();

const tester = new ProgressRoutesTester(
  getEmergencyHPActionProgressRoutesProps(),
  "Emergency HP Action"
);

tester.defineSmokeTests({
  session: sb.value,
});

describe("Review page", () => {
  it("opens signing modal", () => {
    const pal = new AppTesterPal(
      <ProgressRoutes {...getEmergencyHPActionProgressRoutesProps()} />,
      {
        url: JustfixRoutes.locale.ehp.reviewForms,
        session: sb.value,
      }
    );
    pal.clickButtonOrLink(/look good to me/);
    pal.getByTextAndSelector(/sign my forms/i, "button");
  });
});
