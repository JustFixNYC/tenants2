import React from "react";
import { BlankLandlordDetailsType } from "../../../queries/LandlordDetailsType";
import { AppTesterPal } from "../../../tests/app-tester-pal";
import { LaLetterBuilderRouteInfo } from "../../route-info";
import { newSb } from "../../../tests/session-builder";
import { LaLetterBuilderSendOptionsMutation } from "../../../queries/LaLetterBuilderSendOptionsMutation";
import HabitabilityRoutes from "../../letter-builder/habitability/routes";
import { LaMailingChoice } from "../../../../../common-data/laletterbuilder-mailing-choices";
import { HabitabilityLetterMailChoice } from "../../../queries/globalTypes";
import { BlankAllSessionInfo } from "../../../queries/AllSessionInfo";
import { override } from "../../../tests/util";

const sb = newSb().withLoggedInJustfixUser();

const blankHabitabilityLetter = {
  trackingNumber: "",
  letterSentAt: "",
  fullyProcessedAt: "",
  createdAt: "2020-03-13T19:41:09+00:00",
};

describe("send options page", () => {
  it("works when user selects send option", async () => {
    const pal = new AppTesterPal(<HabitabilityRoutes />, {
      url: LaLetterBuilderRouteInfo.locale.habitability.sending, // TODO: generalize to all letter types
      session: sb.with({
        landlordDetails: BlankLandlordDetailsType,
      }).value,
    });
    pal.clickRadioOrCheckbox(/^Send myself/i);
    await pal.rr.getByText(/^Send myself/i);
  });

  it("redirects to next step after successful submission", async () => {
    const pal = new AppTesterPal(<HabitabilityRoutes />, {
      url: LaLetterBuilderRouteInfo.locale.habitability.sending, // TODO: generalize to all letter types
      session: sb.with({
        landlordDetails: BlankLandlordDetailsType,
      }).value,
    });
    const email = "boopsy@boopmail.com";
    const mailChoice: LaMailingChoice = "USER_WILL_MAIL";

    pal.clickRadioOrCheckbox(/^Send myself/i);
    pal.fillFormFields([[/email/i, email]]);
    pal.clickButtonOrLink("Next");
    pal
      .withFormMutation(LaLetterBuilderSendOptionsMutation)
      .expect({
        email,
        mailChoice,
      })
      .respondWith({
        errors: [],
        session: override(BlankAllSessionInfo, {
          landlordDetails: { ...BlankLandlordDetailsType, email },
          habitabilityLatestLetter: {
            ...blankHabitabilityLetter,
            mailChoice: HabitabilityLetterMailChoice.USER_WILL_MAIL,
          },
        }),
      });

    await pal.rt.waitFor(() =>
      pal.rr.getByText(/See all your finished and unfinished letters/i)
    );
    const { mock } = pal.appContext.updateSession;
    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0][0]["landlordDetails"]["email"]).toEqual(email);
    expect(mock.calls[0][0]["habitabilityLatestLetter"]["mailChoice"]).toEqual(
      HabitabilityLetterMailChoice.USER_WILL_MAIL
    );
  });

  it("redirects to next step after successful submission with default mail choice and email (blank)", async () => {
    const pal = new AppTesterPal(<HabitabilityRoutes />, {
      url: LaLetterBuilderRouteInfo.locale.habitability.sending, // TODO: generalize to all letter types
      session: sb.with({
        landlordDetails: BlankLandlordDetailsType,
      }).value,
    });

    pal.clickButtonOrLink("Next");
    pal
      .withFormMutation(LaLetterBuilderSendOptionsMutation)
      .expect({
        email: "",
        mailChoice: HabitabilityLetterMailChoice.WE_WILL_MAIL,
      })
      .respondWith({
        errors: [],
        session: override(BlankAllSessionInfo, {
          landlordDetails: { ...BlankLandlordDetailsType },
          habitabilityLatestLetter: {
            ...blankHabitabilityLetter,
            mailChoice: HabitabilityLetterMailChoice.WE_WILL_MAIL,
          },
        }),
      });

    await pal.rt.waitFor(() =>
      pal.rr.getByText(/See all your finished and unfinished letters/i)
    );
    const { mock } = pal.appContext.updateSession;
    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0][0]["landlordDetails"]["email"]).toEqual("");
    expect(mock.calls[0][0]["habitabilityLatestLetter"]["mailChoice"]).toEqual(
      HabitabilityLetterMailChoice.WE_WILL_MAIL
    );
  });
});