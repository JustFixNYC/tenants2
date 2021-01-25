import { AllSessionInfo } from "../queries/AllSessionInfo";
import { ProgressStepRoute } from "./progress-step-route";

/**
 * Convenience function that decorates the given list of steps
 * so they are skipped if the given predicate returns true.
 */
export function skipStepsIf(
  predicate: (s: AllSessionInfo) => boolean,
  steps: ProgressStepRoute[]
): ProgressStepRoute[] {
  return steps.map((step) => {
    return {
      ...step,
      shouldBeSkipped(s) {
        if (predicate(s)) return true;
        if (step.shouldBeSkipped) return step.shouldBeSkipped(s);
        return false;
      },
    };
  });
}
