import React from "react";

import OnboardingStep4 from "../onboarding-step-4";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { Switch, Route } from "react-router";
import JustfixRoutes from "../../justfix-routes";
import { OnboardingInfoSignupIntent } from "../../queries/globalTypes";
import { OnboardingStep4Version2Mutation } from "../../queries/OnboardingStep4Version2Mutation";
import { BlankAllSessionInfo } from "../../queries/AllSessionInfo";

const PROPS = {
  routes: JustfixRoutes.locale.onboarding,
  toSuccess: "/success",
  signupIntent: OnboardingInfoSignupIntent.HP,
};

describe("onboarding step 4 page", () => {
  afterEach(AppTesterPal.cleanup);

  it("redirects on successful signup", async () => {
    const pal = new AppTesterPal(
      (
        <Switch>
          <Route path="/" exact render={() => <OnboardingStep4 {...PROPS} />} />
          <Route path="/success" render={() => <h1>HOORAY</h1>} />
          <Route render={() => <p>NOT FOUND</p>} />
        </Switch>
      )
    );

    pal.clickButtonOrLink(/continue/i);
    pal.withFormMutation(OnboardingStep4Version2Mutation).respondWith({
      errors: [],
      session: BlankAllSessionInfo,
    });
    await pal.rt.waitForElement(() => pal.rr.getByText("HOORAY"));
  });

  it("opens terms and conditions modal when link is clicked", async () => {
    const pal = new AppTesterPal(<OnboardingStep4 {...PROPS} />);

    pal.clickButtonOrLink(/terms/i);
    pal.getDialogWithLabel(/Your privacy is very/i);
  });
});
