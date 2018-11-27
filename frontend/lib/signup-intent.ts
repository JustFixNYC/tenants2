import { OnboardingInfoSignupIntent } from "./queries/globalTypes";
import { AllSessionInfo_onboardingInfo } from "./queries/AllSessionInfo";

/** The default assumed intent if none is explicitly provided. */
export const DEFAULT_SIGNUP_INTENT_CHOICE = OnboardingInfoSignupIntent.LOC;

export function signupIntentFromOnboardingInfo(onboardingInfo: AllSessionInfo_onboardingInfo|null): OnboardingInfoSignupIntent {
  if (!onboardingInfo) return DEFAULT_SIGNUP_INTENT_CHOICE;
  return onboardingInfo.signupIntent;
}
