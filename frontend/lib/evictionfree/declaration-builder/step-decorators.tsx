import { OnboardingStep } from "../../common-steps/step-decorators";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { EvictionFreeAlreadyLoggedInErrorPage } from "./error-pages";

/**
 * A middle step before the user has created an account.
 */
export const EvictionFreeOnboardingStep = OnboardingStep.bind(
  this,
  EvictionFreeAlreadyLoggedInErrorPage
);

/**
 * Whether or not the user has sent a COVID-19 Hardship Declaration.
 */
export function hasEvictionFreeDeclarationBeenSent(s: AllSessionInfo): boolean {
  // TODO: Implement this.
  return false;
}
