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
    pal.clickRadioOrCheckbox(/^Mail myself/i);
    await pal.rr.getByText(/^Mail myself/i);
  });

  it("renders modal with email and no landlord address", async () => {
    const pal = new AppTesterPal(<HabitabilityRoutes />, {
      url: LaLetterBuilderRouteInfo.locale.habitability.sending, // TODO: generalize to all letter types
      session: sb.with({
        landlordDetails: BlankLandlordDetailsType,
        habitabilityLatestLetter: {
          ...blankHabitabilityLetter,
          mailChoice: HabitabilityLetterMailChoice.WE_WILL_MAIL,
          emailToLandlord: true,
        },
      }).value,
    });
    const email = "boopsy@boopmail.com";
    const mailChoice: LaMailingChoice = "USER_WILL_MAIL";

    const updatedSession = {
      landlordDetails: { ...BlankLandlordDetailsType, email },
      habitabilityLatestLetter: {
        ...blankHabitabilityLetter,
        mailChoice: HabitabilityLetterMailChoice.USER_WILL_MAIL,
        emailToLandlord: true,
      },
    };

    pal.clickRadioOrCheckbox(/^Mail myself/i);
    pal.fillFormFields([[/email/i, email]]);
    pal.clickButtonOrLink("Next");
    pal
      .withFormMutation(LaLetterBuilderSendOptionsMutation)
      .expect({
        email,
        noLandlordEmail: false,
        mailChoice,
      })
      .respondWith({
        errors: [],
        session: override(BlankAllSessionInfo, updatedSession),
      });

    pal.appContext.session = {
      ...pal.appContext.session,
      ...updatedSession,
    };

    await pal.waitForLocation("/en/habitability/sending/confirm-modal");
    await pal.rt.waitFor(() =>
      pal.getDialogWithLabel(
        /Are you sure you want to mail the letter yourself\?/i
      )
    );

    const { mock } = pal.appContext.updateSession;
    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0][0]["landlordDetails"]["email"]).toEqual(email);
    expect(mock.calls[0][0]["habitabilityLatestLetter"]["mailChoice"]).toEqual(
      HabitabilityLetterMailChoice.USER_WILL_MAIL
    );
  });

  it("renders modal with landlord address and no email", async () => {
    const pal = new AppTesterPal(<HabitabilityRoutes />, {
      url: LaLetterBuilderRouteInfo.locale.habitability.sending, // TODO: generalize to all letter types
      session: sb.with({
        landlordDetails: BlankLandlordDetailsType,
        habitabilityLatestLetter: {
          ...blankHabitabilityLetter,
          mailChoice: HabitabilityLetterMailChoice.WE_WILL_MAIL,
          emailToLandlord: true,
        },
      }).value,
    });

    const updatedSession = {
      landlordDetails: { ...BlankLandlordDetailsType },
      habitabilityLatestLetter: {
        ...blankHabitabilityLetter,
        mailChoice: HabitabilityLetterMailChoice.WE_WILL_MAIL,
        emailToLandlord: false,
      },
    };

    pal.clickRadioOrCheckbox(/^I don't have this/i);
    pal.clickButtonOrLink("Next");
    pal
      .withFormMutation(LaLetterBuilderSendOptionsMutation)
      .expect({
        email: "",
        noLandlordEmail: true,
        mailChoice: HabitabilityLetterMailChoice.WE_WILL_MAIL,
      })
      .respondWith({
        errors: [],
        session: override(BlankAllSessionInfo, updatedSession),
      });

    pal.appContext.session = {
      ...pal.appContext.session,
      ...updatedSession,
    };

    await pal.waitForLocation("/en/habitability/sending/confirm-modal");
    await pal.rt.waitFor(() =>
      pal.getDialogWithLabel(/Mail letter now for free/i)
    );

    const { mock } = pal.appContext.updateSession;
    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0][0]["landlordDetails"]["email"]).toEqual("");
    expect(mock.calls[0][0]["habitabilityLatestLetter"]["mailChoice"]).toEqual(
      HabitabilityLetterMailChoice.WE_WILL_MAIL
    );
  });
});
