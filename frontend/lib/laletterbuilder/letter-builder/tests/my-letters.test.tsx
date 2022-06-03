import React from "react";
import { LaLetterBuilderRouteComponent } from "../../routes";
import { LaLetterBuilderRouteInfo } from "../../route-info";
import { AppTesterPal } from "../../../tests/app-tester-pal";
import { Route } from "react-router-dom";
import { newSb } from "../../../tests/session-builder";
import HabitabilityRoutes from "../habitability/routes";
import { LaLetterBuilderCreateLetterMutation } from "../../../queries/LaLetterBuilderCreateLetterMutation";
import { BlankAllSessionInfo } from "../../../queries/AllSessionInfo";
import { override } from "../../../tests/util";

const sb = newSb().withLoggedInJustfixUser();

describe("my letters page", () => {
  it("loads with no letter in progress", () => {
    const pal = new AppTesterPal(
      <Route component={LaLetterBuilderRouteComponent} />,
      {
        url: LaLetterBuilderRouteInfo.locale.habitability.myLetters,
        session: sb.value,
      }
    );
    pal.rr.getByText(/Start your habitability letter/i);
  });

  it("loads with a letter in progress", () => {
    const pal = new AppTesterPal(
      <Route component={LaLetterBuilderRouteComponent} />,
      {
        url: LaLetterBuilderRouteInfo.locale.habitability.myLetters,
        session: sb.withHabitabilityLetterInProgress().value,
      }
    );
    pal.rr.getByText(/Continue my letter/i);
  });

  it("goes to issues step after creating a new letter", async () => {
    const pal = new AppTesterPal(<HabitabilityRoutes />, {
      url: LaLetterBuilderRouteInfo.locale.habitability.myLetters,
      updateSession: true,
      session: sb.value,
    });
    pal.clickButtonOrLink("Let's go");
    pal
      .withFormMutation(LaLetterBuilderCreateLetterMutation)
      .expect({})
      .respondWithSuccess({
        session: override(BlankAllSessionInfo, {
          habitabilityLatestLetter: {
            createdAt: "2020-03-13T19:41:09+00:00",
            trackingNumber: "",
            letterSentAt: "",
            fullyProcessedAt: "",
          },
          hasHabitabilityLetterInProgress: true,
        }),
      });
    await pal.waitForLocation("/en/habitability/issues");
    pal.rr.getByText(/Select which repairs/i);
  });

  it("goes to issues step with letter in progress", async () => {
    const pal = new AppTesterPal(<HabitabilityRoutes />, {
      url: LaLetterBuilderRouteInfo.locale.habitability.myLetters,
      updateSession: true,
      session: sb.withHabitabilityLetterInProgress().value,
    });
    pal.clickButtonOrLink("Continue my letter");
    await pal.waitForLocation("/en/habitability/issues");
    pal.rr.getByText(/Select which repairs/i);
  });
});
