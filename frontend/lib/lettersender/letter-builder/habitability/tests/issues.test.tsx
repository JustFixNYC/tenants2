import { preloadLingui } from "../../../../tests/lingui-preloader";
import { LaLetterBuilderLinguiI18n } from "../../../site";
import { AppTesterPal } from "../../../../tests/app-tester-pal";
import React from "react";
import { Route } from "react-router-dom";
import { newSb } from "../../../../tests/session-builder";
import { LaLetterBuilderRouteComponent } from "../../../routes";
import { LaLetterBuilderRouteInfo } from "../../../route-info";

beforeAll(preloadLingui(LaLetterBuilderLinguiI18n));

const sb = newSb().withLoggedInJustfixUser();

describe("issues page", () => {
  it("loads", () => {
    const pal = new AppTesterPal(
      <Route component={LaLetterBuilderRouteComponent} />,
      {
        url: LaLetterBuilderRouteInfo.locale.habitability.issues.prefix,
        session: sb.value,
      }
    );
    pal.rr.getAllByText(/Select the repairs you need in your home/i);
  });
});
