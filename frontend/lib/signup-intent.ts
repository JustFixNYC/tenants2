import { OnboardingInfoSignupIntent } from "./queries/globalTypes";
import { AllSessionInfo_onboardingInfo } from "./queries/AllSessionInfo";

/** The default assumed intent if none is explicitly provided. */
export const DEFAULT_SIGNUP_INTENT_CHOICE = OnboardingInfoSignupIntent.LOC;

/**
 * Attempt to validate the provided case-insensitive string representation
 * of a choice from a potentially untrusted source, e.g. a querystring,
 * and return either the valid choice or a default value.
 */
export function validateSignupIntent(choice: string|undefined, defaultValue = DEFAULT_SIGNUP_INTENT_CHOICE): OnboardingInfoSignupIntent {
  if (!choice) return defaultValue;
  choice = choice.toUpperCase();
  for (let s in OnboardingInfoSignupIntent) {
    if (choice === s) return OnboardingInfoSignupIntent[s] as OnboardingInfoSignupIntent;
  }
  return defaultValue;
}

export function signupIntentFromOnboardingInfo(onboardingInfo: AllSessionInfo_onboardingInfo|null): OnboardingInfoSignupIntent {
  if (!onboardingInfo) return DEFAULT_SIGNUP_INTENT_CHOICE;
  return onboardingInfo.signupIntent;
}
