import React from "react";
import {
  ProgressRoutesProps,
  buildProgressRoutesComponent,
} from "../../../progress/progress-routes";
import { createStartAccountOrLoginSteps } from "../steps";
import { createStartAccountOrLoginRouteInfo } from "../routes";
import { AppTesterPal } from "../../../tests/app-tester-pal";
import { QueryOrVerifyPhoneNumberMutation } from "../../../queries/QueryOrVerifyPhoneNumberMutation";
import { newSb } from "../../../tests/session-builder";
import { PhoneNumberAccountStatus } from "../../../queries/globalTypes";
import { waitFor } from "@testing-library/dom";

const sb = newSb();

const routes = createStartAccountOrLoginRouteInfo("");

function createSteps(): ProgressRoutesProps {
  return {
    toLatestStep: "/latest",
    welcomeSteps: [
      {
        path: "/welcome",
        render: () => <p>WELCOME</p>,
      },
    ],
    stepsToFillOut: createStartAccountOrLoginSteps(routes),
    confirmationSteps: [
      {
        path: "/done",
        render: () => <p>DONE</p>,
      },
    ],
  };
}

const Routes = buildProgressRoutesComponent(createSteps);

describe("start-account-or-login flow", () => {
  it("goes directly to end if account is new", async () => {
    const pal = new AppTesterPal(<Routes />, {
      url: routes.phoneNumber,
      updateSession: true,
    });
    pal.fillFormFields([[/phone number/i, "5551234567"]]);
    pal.clickButtonOrLink(/next/i);
    pal
      .withFormMutation(QueryOrVerifyPhoneNumberMutation)
      .expect({
        phoneNumber: "5551234567",
      })
      .respondWith({
        errors: [],
        session: sb.with({
          lastQueriedPhoneNumber: "5551234567",
          lastQueriedPhoneNumberAccountStatus:
            PhoneNumberAccountStatus.NO_ACCOUNT,
        }).value,
        accountStatus: PhoneNumberAccountStatus.NO_ACCOUNT,
      });

    await waitFor(() => expect(pal.history.location.pathname).toBe("/done"));
  });
});
