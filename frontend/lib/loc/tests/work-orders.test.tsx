import React from "react";

import JustfixRoutes from "../../justfix-route-info";
import LetterOfComplaintRoutes, { LocLinguiI18n } from "../routes";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { newSb } from "../../tests/session-builder";
import { WorkOrderTicketsMutation } from "../../queries/WorkOrderTicketsMutation";
import { preloadLingui } from "../../tests/lingui-preloader";

beforeAll(preloadLingui(LocLinguiI18n));

describe("work order tickets page", () => {
  it("redirects to next step after submitting valid work order tickets", async () => {
    const pal = new AppTesterPal(<LetterOfComplaintRoutes />, {
      url: JustfixRoutes.locale.loc.workOrders,
      session: newSb().withLoggedInNychaJustfixUser().value,
    });

    pal.fillFirstFormField([/Work order ticket number/i, "ABCDE12345"]);
    pal.clickButtonOrLink("Next");
    pal.withFormMutation(WorkOrderTicketsMutation).respondWith({
      errors: [],
      session: { workOrderTickets: ["ABCDE12345"], hasSeenWorkOrderPage: null },
    });

    await pal.rt.waitFor(() => pal.rr.getByText(/Landlord information/i));
    const { mock } = pal.appContext.updateSession;
    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0][0]).toEqual({
      hasSeenWorkOrderPage: null,
      workOrderTickets: ["ABCDE12345"],
    });
  });
});

describe("work order tickets page", () => {
  it("redirects to next step after selecting `I don't have a ticket number`", async () => {
    const pal = new AppTesterPal(<LetterOfComplaintRoutes />, {
      url: JustfixRoutes.locale.loc.workOrders,
      session: newSb().withLoggedInNychaJustfixUser().value,
    });
    pal.clickRadioOrCheckbox("I don't have a ticket number");
    pal.clickButtonOrLink("Next");

    pal.withFormMutation(WorkOrderTicketsMutation).respondWith({
      errors: [],
      session: { workOrderTickets: [], hasSeenWorkOrderPage: true },
    });

    await pal.rt.waitFor(() => pal.rr.getByText(/Landlord information/i));
    const { mock } = pal.appContext.updateSession;
    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0][0]).toEqual({
      hasSeenWorkOrderPage: true,
      workOrderTickets: [],
    });
  });
});

describe("work order tickets page", () => {
  it("displays error message if no ticket numbers are entered", async () => {
    const pal = new AppTesterPal(<LetterOfComplaintRoutes />, {
      url: JustfixRoutes.locale.loc.workOrders,
      session: newSb().withLoggedInNychaJustfixUser().value,
    });

    pal.clickButtonOrLink("Next");
    pal.withFormMutation(WorkOrderTicketsMutation).respondWith({
      errors: [
        {
          field: "__all__",
          extendedMessages: [
            {
              message:
                "Enter at least 1 ticket number or select `I don't have a ticket number.`",
              code: null,
            },
          ],
        },
      ],
      session: null,
    });

    await pal.rt.waitFor(() =>
      pal.rr.getByText(/Enter at least 1 ticket number/i)
    );
  });
});
