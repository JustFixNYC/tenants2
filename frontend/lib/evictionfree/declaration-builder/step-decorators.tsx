import { OnboardingStep } from "../../common-steps/step-decorators";
import {
  MiddleProgressStep,
  MiddleProgressStepProps,
  ProgressStepProps,
} from "../../progress/progress-step-route";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { withSessionErrorHandling } from "../../ui/session-error-handling";
import { isUserLoggedOut } from "../../util/session-predicates";
import {
  EvictionFreeAlreadySentDeclarationErrorPage,
  EvictionFreeAlreadyLoggedInErrorPage,
  EvictionFreeNotLoggedInErrorPage,
} from "./error-pages";

type MiddleStepComponent = React.ComponentType<MiddleProgressStepProps>;
type StepComponent = React.ComponentType<ProgressStepProps>;

/**
 * A middle step before the user has created an account.
 */
export const EvictionFreeOnboardingStep = OnboardingStep.bind(
  this,
  EvictionFreeAlreadyLoggedInErrorPage
);

/**
 * A step that requires the user to be logged-in to view.
 */
export const EvictionFreeRequireLoginStep = (c: StepComponent) =>
  withSessionErrorHandling(
    isUserLoggedOut,
    EvictionFreeNotLoggedInErrorPage,
    c
  );

const requireNotSentDeclaration = (c: StepComponent) =>
  EvictionFreeRequireLoginStep(
    withSessionErrorHandling(
      hasEvictionFreeDeclarationBeenSent,
      EvictionFreeAlreadySentDeclarationErrorPage,
      c
    )
  );

export const EvictionFreeNotSentDeclarationStep = (c: MiddleStepComponent) =>
  requireNotSentDeclaration(MiddleProgressStep(c));

/**
 * Whether or not the user has sent a COVID-19 Hardship Declaration.
 */
export function hasEvictionFreeDeclarationBeenSent(s: AllSessionInfo): boolean {
  return s.submittedHardshipDeclaration !== null;
}
