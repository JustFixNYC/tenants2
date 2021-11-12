import { OnboardingStep } from "../../common-steps/step-decorators";
import { LALetterBuilderAlreadyLoggedInErrorPage } from "./error-pages";

/**
 * A middle step before the user has created an account.
 */
export const LALetterBuilderOnboardingStep = OnboardingStep.bind(
  this,
  LALetterBuilderAlreadyLoggedInErrorPage
);
