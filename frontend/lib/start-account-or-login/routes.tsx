import React from "react";
import { PhoneNumberAccountStatus } from "../queries/globalTypes";
import { StartAccountOrLoginRouteInfo } from "./route-info";
import {
  ProgressStepRoute,
  ProgressStepProps,
  MiddleProgressStepProps,
} from "../progress/progress-step-route";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { AskPhoneNumber } from "./ask-phone-number";
import { VerifyPassword } from "./verify-password";
import { SetPassword } from "./set-password";
import { VerifyPhoneNumber } from "./verify-phone-number";
import { isUserLoggedIn } from "../util/session-predicates";
import { assertNotNull } from "@justfixnyc/util";

export type StartAccountOrLoginProps = MiddleProgressStepProps & {
  routes: StartAccountOrLoginRouteInfo;
};

/**
 * This function defines all routes within Account Creation/Login flow.
 * To find the map of each route to its corresponding URL path, check out
 * the `route-info.ts` file in the same directory as this file.
 *
 * @param routes
 * @param {string} alternateWelcomeRoute Some apps (like LA Letter Builder)
 * don't have an explicit welcome screen, and so the login steps are the first
 * steps in the routes list. In this case you need to specify a route
 * (e.g. /en/home/) to go to when a user clicks "back" from the first login step.
 */
export function createStartAccountOrLoginSteps(
  routes: StartAccountOrLoginRouteInfo,
  alternateWelcomeRoute?: string
): ProgressStepRoute[] {
  const wrap = (Component: React.ComponentType<StartAccountOrLoginProps>) => {
    return (props: ProgressStepProps) => (
      <Component
        {...props}
        routes={routes}
        prevStep={alternateWelcomeRoute || assertNotNull(props.prevStep)}
        nextStep={assertNotNull(props.nextStep)}
      />
    );
  };
  return [
    {
      path: routes.phoneNumber,
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
