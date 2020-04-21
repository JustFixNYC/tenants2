import React from "react";
import { PhoneNumberAccountStatus } from "../../queries/globalTypes";
import { StartAccountOrLoginRouteInfo } from "./routes";
import {
  ProgressStepRoute,
  ProgressStepProps,
  MiddleProgressStepProps,
} from "../../progress/progress-step-route";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { AskPhoneNumber } from "./ask-phone-number";
import { VerifyPassword } from "./verify-password";
import { SetPassword } from "./set-password";
import { VerifyPhoneNumber } from "./verify-phone-number";
import { isUserLoggedIn } from "../../util/session-predicates";
import { assertNotNull } from "../../util/util";

export type StartAccountOrLoginProps = MiddleProgressStepProps & {
  routes: StartAccountOrLoginRouteInfo;
};

export function createStartAccountOrLoginSteps(
  routes: StartAccountOrLoginRouteInfo
): ProgressStepRoute[] {
  const wrap = (Component: React.ComponentType<StartAccountOrLoginProps>) => {
    return (props: ProgressStepProps) => (
      <Component
        {...props}
        routes={routes}
        prevStep={assertNotNull(props.prevStep)}
        nextStep={assertNotNull(props.nextStep)}
      />
    );
  };
  return [
    {
      path: routes.phoneNumber,
      exact: true,
      shouldBeSkipped: isUserLoggedIn,
      render: wrap(AskPhoneNumber),
    },
    {
      path: routes.verifyPassword,
      shouldBeSkipped: isUserLoggedInOrCreatingNewAccount,
      render: wrap(VerifyPassword),
    },
    {
      path: routes.verifyPhoneNumber,
      exact: true,
      shouldBeSkipped: isUserLoggedInOrCreatingNewAccount,
      render: wrap(VerifyPhoneNumber),
    },
    {
      path: routes.setPassword,
      exact: true,
      shouldBeSkipped: isUserLoggedInOrCreatingNewAccount,
      render: wrap(SetPassword),
    },
  ];
}

function isUserLoggedInOrCreatingNewAccount(s: AllSessionInfo): boolean {
  return (
    isUserLoggedIn(s) ||
    s.lastQueriedPhoneNumberAccountStatus ===
      PhoneNumberAccountStatus.NO_ACCOUNT
  );
}
