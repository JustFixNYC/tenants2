import React from "react";
import { PhoneNumberAccountStatus } from "../../queries/globalTypes";
import { StartAccountOrLoginRouteInfo } from "./routes";
import { ProgressStepRoute } from "../../progress/progress-step-route";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { AskPhoneNumber } from "./ask-phone-number";
import { VerifyPassword } from "./verify-password";
import { SetPassword } from "./set-password";
import { VerifyPhoneNumber } from "./verify-phone-number";

export type StartAccountOrLoginProps = {
  routes: StartAccountOrLoginRouteInfo;
  toNextPhase: string;
  toPreviousPhase: string;
};

export function createStartAccountOrLoginSteps(
  props: StartAccountOrLoginProps
): ProgressStepRoute[] {
  const { routes } = props;
  return [
    {
      path: routes.phoneNumber,
      exact: true,
      shouldBeSkipped: isUserLoggedIn,
      render: () => <AskPhoneNumber {...props} />,
    },
    {
      path: routes.verifyPassword,
      shouldBeSkipped: isUserLoggedInOrCreatingNewAccount,
      render: () => <VerifyPassword {...props} />,
    },
    {
      path: routes.verifyPhoneNumber,
      exact: true,
      shouldBeSkipped: isUserLoggedInOrCreatingNewAccount,
      render: () => <VerifyPhoneNumber {...props} />,
    },
    {
      path: routes.setPassword,
      exact: true,
      shouldBeSkipped: isUserLoggedInOrCreatingNewAccount,
      render: () => <SetPassword {...props} />,
    },
  ];
}

function isUserLoggedIn(s: AllSessionInfo): boolean {
  return !!s.phoneNumber;
}

function isUserLoggedInOrCreatingNewAccount(s: AllSessionInfo): boolean {
  return (
    isUserLoggedIn(s) ||
    s.lastQueriedPhoneNumberAccountStatus ===
      PhoneNumberAccountStatus.NO_ACCOUNT
  );
}
