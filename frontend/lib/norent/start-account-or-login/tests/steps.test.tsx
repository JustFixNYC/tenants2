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
      ...createStartAccountOrLoginSteps(routes),
    ],
    stepsToFillOut: [],
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
  const startFlow = (status: PhoneNumberAccountStatus) => {
    const pal = new AppTesterPal(<Routes />, {
      url: "/phone/ask",
      updateSession: true,
    });
    pal.fillFormFields([[/phone number/i, "5551234567"]]);
    pal.clickButtonOrLink(/next/i);
    pal
      .withFormMutation(QueryOrVerifyPhoneNumberMutation)
      .expect({
        phoneNumber: "5551234567",
      })
      .respondWithSuccess({
        session: sb.with({
          lastQueriedPhoneNumber: "5551234567",
          lastQueriedPhoneNumberAccountStatus: status,
        }).value,
        accountStatus: status,
      });
    return pal;
  };

  it("asks for phone number and shows back button and terms modal", () => {
    const pal = new AppTesterPal(<Routes />, { url: "/phone/ask" });
    pal.ensureLinkGoesTo(/back/i, "/welcome");
    pal.clickButtonOrLink(/privacy/i);
    pal.ensureLocation(routes.phoneNumberTermsModal);
    pal.rr.getByText(/anonymized data/i);
    pal.clickButtonOrLink(/got it/i);
    pal.ensureLocation("/phone/ask");
  });

  it("goes directly to end if account is new", async () => {
    const pal = startFlow(PhoneNumberAccountStatus.NO_ACCOUNT);
    await pal.waitForLocation("/done");
  });

  it("goes to phone number verification if account has no password", async () => {
    const pal = startFlow(PhoneNumberAccountStatus.ACCOUNT_WITHOUT_PASSWORD);
    await pal.waitForLocation("/phone/verify");
    pal.ensureLinkGoesTo(/back/i, "/phone/ask");
  });
});
