import React from "react";
import {
  ProgressRoutesProps,
  buildProgressRoutesComponent,
} from "../../progress/progress-routes";
import { createStartAccountOrLoginSteps } from "../routes";
import { createStartAccountOrLoginRouteInfo } from "../route-info";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { QueryOrVerifyPhoneNumberMutation } from "../../queries/QueryOrVerifyPhoneNumberMutation";
import { PhoneNumberAccountStatus } from "../../queries/globalTypes";
import { PasswordResetVerificationCodeMutation } from "../../queries/PasswordResetVerificationCodeMutation";
import { PasswordResetConfirmAndLoginMutation } from "../../queries/PasswordResetConfirmAndLoginMutation";
import { LoginMutation } from "../../queries/LoginMutation";
import { PasswordResetMutation } from "../../queries/PasswordResetMutation";

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
        session: pal.sessionBuilder.withQueriedPhoneNumber(status).value,
        accountStatus: status,
      });
    return pal;
  };

  it("asks for phone number and shows back button and terms modal", () => {
    const pal = new AppTesterPal(<Routes />, { url: "/phone/ask" });
    pal.ensureLinkGoesTo(/back/i, "/welcome");
    pal.clickButtonOrLink(/privacy/i);
    pal.ensureLocation(routes.phoneNumberTermsModal);
    pal.rr.getByText(/We don’t use your personal information for profit/i);
    pal.clickButtonOrLink(/got it/i);
    pal.ensureLocation("/phone/ask");
  });

  it("if account is new, goes directly to end", async () => {
    const pal = startFlow(PhoneNumberAccountStatus.NO_ACCOUNT);
    await pal.waitForLocation("/done");
  });

  it("if account has password, verifies it and logs user in", async () => {
    const pal = startFlow(PhoneNumberAccountStatus.ACCOUNT_WITH_PASSWORD);

    await pal.waitForLocation("/password/verify");
    pal.ensureLinkGoesTo(/back/i, "/phone/ask");
    pal.fillFormFields([[/password/i, "passwordy"]]);
    pal.clickButtonOrLink(/next/i);
    pal
      .withFormMutation(LoginMutation)
      .expect({
        phoneNumber: "5551234567",
        password: "passwordy",
      })
      .respondWithSuccess({
        session: pal.sessionBuilder.withLoggedInUser().value,
      });
    await pal.waitForLocation("/done");
  });

  it("if account has password, allows user to reset it", async () => {
    const pal = startFlow(PhoneNumberAccountStatus.ACCOUNT_WITH_PASSWORD);

    await pal.waitForLocation("/password/verify");
    pal.clickButtonOrLink(/forgot/i);
    pal.ensureLocation(routes.forgotPasswordModal);
    pal.clickButtonOrLink(/send code/i);
    pal
      .withFormMutation(PasswordResetMutation)
      .expect({
        phoneNumber: "5551234567",
      })
      .respondWithSuccess({});

    await pal.waitForLocation("/phone/verify");
    pal.ensureLinkGoesTo(/back/i, "/phone/ask");
  });

  it("if account has no password, verifies phone, then sets password", async () => {
    const pal = startFlow(PhoneNumberAccountStatus.ACCOUNT_WITHOUT_PASSWORD);

    await pal.waitForLocation("/phone/verify");
    pal.ensureLinkGoesTo(/back/i, "/phone/ask");
    pal.fillFormFields([[/code/i, "12345"]]);
    pal.clickButtonOrLink(/next/i);
    pal
      .withFormMutation(PasswordResetVerificationCodeMutation)
      .expect({ code: "12345" })
      .respondWithSuccess({});

    await pal.waitForLocation("/password/set");
    pal.ensureLinkGoesTo(/back/i, "/phone/verify");
    pal.fillFormFields([
      [/^new password/i, "passwordy"],
      [/confirm/i, "passwordy"],
    ]);
    pal.clickButtonOrLink(/next/i);
    pal
      .withFormMutation(PasswordResetConfirmAndLoginMutation)
      .expect({
        password: "passwordy",
        confirmPassword: "passwordy",
      })
      .respondWithSuccess({
        session: pal.sessionBuilder.withLoggedInUser().value,
      });

    await pal.waitForLocation("/done");
  });
});
