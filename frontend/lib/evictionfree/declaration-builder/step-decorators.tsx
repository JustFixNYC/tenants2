import { OnboardingStep } from "../../common-steps/step-decorators";
import { EvictionFreeAlreadyLoggedInErrorPage } from "./error-pages";

/**
 * A middle step before the user has created an account.
 */
export const EvictionFreeOnboardingStep = OnboardingStep.bind(
  this,
  EvictionFreeAlreadyLoggedInErrorPage
);
