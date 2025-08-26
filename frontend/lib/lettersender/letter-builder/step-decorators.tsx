import { OnboardingStep } from "../../common-steps/step-decorators";
import { LaLetterBuilderAlreadyLoggedInErrorPage } from "./error-pages";

/**
 * A middle step before the user has created an account.
 */
export const LaLetterBuilderOnboardingStep = OnboardingStep.bind(
  this,
  LaLetterBuilderAlreadyLoggedInErrorPage
);
