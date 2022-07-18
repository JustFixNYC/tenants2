import React from "react";

import { LaLetterBuilderRouteComponent } from "../../routes";
import { LaLetterBuilderRouteInfo } from "../../route-info";
import { newSb } from "../../../tests/session-builder";
import { Route } from "react-router-dom";

import { AppTesterPal } from "../../../tests/app-tester-pal";
import { LaLetterBuilderCreateLetterMutation } from "../../../queries/LaLetterBuilderCreateLetterMutation";
import { BlankAllSessionInfo } from "../../../queries/AllSessionInfo";
import { override } from "../../../tests/util";
import { HabitabilityLetterMailChoice } from "../../../queries/globalTypes";

const sb = newSb();

describe("choose letter page", () => {
  it("loads", () => {
    const pal = new AppTesterPal(
      <Route component={LaLetterBuilderRouteComponent} />,
      {
        url: LaLetterBuilderRouteInfo.locale.chooseLetter,
        session: sb.value,
      }
    );
    pal.rr.getByText(/Notice to repair/i);
  });

  it("redirects to phone number with logged out user", async () => {
    const pal = new AppTesterPal(
      <Route component={LaLetterBuilderRouteComponent} />,
      {
        url: LaLetterBuilderRouteInfo.locale.chooseLetter,
        session: sb.value,
      }
    );
    pal.clickButtonOrLink("Start letter");
    await pal.rt.waitFor(() => pal.rr.getByText(/Your phone number/i));
  });

  it("creates a new letter and redirects to issues with logged in user", async () => {
    const pal = new AppTesterPal(
      <Route component={LaLetterBuilderRouteComponent} />,
      {
        url: LaLetterBuilderRouteInfo.locale.chooseLetter,
        updateSession: true,
        session: sb.withLoggedInJustfixUser().value,
      }
    );
    pal.clickButtonOrLink("Start letter");
    pal
      .withFormMutation(LaLetterBuilderCreateLetterMutation)
      .expect({})
      .respondWithSuccess({
        session: override(BlankAllSessionInfo, {
          habitabilityLatestLetter: {
            id: "1",
            createdAt: "2020-03-13T19:41:09+00:00",
            trackingNumber: "",
            letterSentAt: "",
            fullyProcessedAt: "",
            mailChoice: HabitabilityLetterMailChoice.WE_WILL_MAIL,
            emailToLandlord: false,
          },
          hasHabitabilityLetterInProgress: true,
        }),
      });
    await pal.waitForLocation("/en/habitability/issues");
    pal.rr.getByText(/Select the repairs/i);
  });

  it("redirects to my letters with logged in user and letter in progress", async () => {
    const pal = new AppTesterPal(
      <Route component={LaLetterBuilderRouteComponent} />,
      {
        url: LaLetterBuilderRouteInfo.locale.chooseLetter,
        session: sb.withLoggedInJustfixUser().withHabitabilityLetterInProgress()
          .value,
      }
    );
    pal.clickButtonOrLink("Start letter");
    await pal.waitForLocation("/en/habitability/my-letters");
    await pal.rt.waitFor(() => pal.rr.getByText(/My letters/i));
  });
});
