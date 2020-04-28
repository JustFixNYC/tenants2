import React from "react";
import { ProgressStepProps } from "../progress-step-route";
import { Route } from "react-router-dom";

/**
 * Returns JSX that fully encapsulates a progress step route.
 * Useful for testing.
 */
export function createProgressStepJSX(
  Component: React.ComponentType<ProgressStepProps>,
  prevStep: string | null = "/prev",
  nextStep: string | null = "/next"
): JSX.Element {
  return (
    <Route
      render={(props) => (
        <Component {...props} prevStep={prevStep} nextStep={nextStep} />
      )}
    />
  );
}
