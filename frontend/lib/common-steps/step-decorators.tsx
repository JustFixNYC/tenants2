import React from "react";
import { isUserLoggedIn } from "../util/session-predicates";
import {
  ProgressStepProps,
  MiddleProgressStepProps,
  MiddleProgressStep,
} from "../progress/progress-step-route";
import { withSessionErrorHandling } from "../ui/session-error-handling";

type MiddleStepComponent = React.ComponentType<MiddleProgressStepProps>;
type StepComponent = React.ComponentType<ProgressStepProps>;

const requireLogout = (
  AlreadyLoggedInComponent: React.ComponentType<{}>,
  c: StepComponent
) => withSessionErrorHandling(isUserLoggedIn, AlreadyLoggedInComponent, c);

/**
 * A middle step before the user has created an account.
 */
export const OnboardingStep = (
  AlreadyLoggedInComponent: React.ComponentType<{}>,
  c: MiddleStepComponent
) => requireLogout(AlreadyLoggedInComponent, MiddleProgressStep(c));
