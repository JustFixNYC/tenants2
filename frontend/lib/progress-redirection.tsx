import React from 'react';

import { AllSessionInfo } from "./queries/AllSessionInfo";
import { ProgressStepRoute } from "./progress-step-route";
import { withAppContext, AppContextType } from "./app-context";
import { Redirect } from "react-router";

export type SessionProgressStepRoute = {
  /**
   * Returns whether or not the user has completed the current step, given the
   * current session.
   */
  isComplete?: (session: AllSessionInfo) => boolean;
} & ProgressStepRoute;

/**
 * Returns the latest step the user still needs to complete.
 */
export function getLatestStep(session: AllSessionInfo, steps: SessionProgressStepRoute[]): string {
  let target = steps[0].path;
  let prevStep = null;

  for (let step of steps) {
    if (prevStep && prevStep.isComplete && prevStep.isComplete(session)) {
      target = step.path;
    }
    prevStep = step;
  }

  return target;
}

export type RedirectToLatestStepProps = {
  steps: SessionProgressStepRoute[];
} & AppContextType;

/**
 * A component that redirects the user to the latest step they
 * still need to complete.
 */
export const RedirectToLatestStep = withAppContext((props: RedirectToLatestStepProps): JSX.Element => {
  return <Redirect to={getLatestStep(props.session, props.steps)} />
});
