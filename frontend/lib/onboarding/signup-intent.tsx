import React from "react";
import { Route } from "react-router";

import { OnboardingInfoSignupIntent } from "../queries/globalTypes";
import { AllSessionInfo_onboardingInfo } from "../queries/AllSessionInfo";
import { getSignupIntentOnboardingInfo } from "../justfix-routes";
import { friendlyLoad, LoadingPage } from "../networking/loading-page";
import loadable from "@loadable/component";

/** The default assumed intent if none is explicitly provided. */
export const DEFAULT_SIGNUP_INTENT_CHOICE = OnboardingInfoSignupIntent.LOC;

export type WithSignupIntent = Pick<
  AllSessionInfo_onboardingInfo,
  "signupIntent"
>;

const LoadableOnboardingRoutes = loadable(
  () => friendlyLoad(import("./steps")),
  {
    fallback: <LoadingPage />,
  }
);

export function signupIntentFromOnboardingInfo(
  onboardingInfo: WithSignupIntent | null
): OnboardingInfoSignupIntent {
  if (!onboardingInfo) return DEFAULT_SIGNUP_INTENT_CHOICE;
  return onboardingInfo.signupIntent;
}

export function getPostOnboardingURL(
  onboardingInfo: WithSignupIntent | null
): string {
  return getSignupIntentOnboardingInfo(
    signupIntentFromOnboardingInfo(onboardingInfo)
  ).postOnboarding;
}

/**
 * Return a <Route> that contains all the onboarding routes for the given intent.
 *
 * Note that this is explicitly *not* a component because we want to be able to
 * include this in a <Switch>, which needs <Route> components as its
 * immediate children.
 */
export function getOnboardingRouteForIntent(
  intent: OnboardingInfoSignupIntent
): JSX.Element {
  const info = getSignupIntentOnboardingInfo(intent);
  return (
    <Route
      path={info.onboarding.prefix}
      render={() => (
        <LoadableOnboardingRoutes
          routes={info.onboarding}
          toCancel={info.preOnboarding}
          toSuccess={info.postOnboarding}
          signupIntent={intent}
        />
      )}
    />
  );
}
