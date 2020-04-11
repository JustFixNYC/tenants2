import { matchPath } from "react-router";
import { BaseProgressStepRoute } from "./progress-step-route";

/**
 * Given a path and a series of step definitions, return
 * the index of the step the path represents.
 */
export function getStepIndexForPathname(
  pathname: string,
  steps: BaseProgressStepRoute[],
  warnIfNotFound = false
): number {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const { path, exact } = step;
    const match = matchPath(pathname, { path, exact });
    if (match) {
      return i;
    }
  }

  if (warnIfNotFound && process.env.NODE_ENV !== "production") {
    console.warn(`Path ${pathname} is not a valid step!`);
  }

  return -1;
}

export type NextOrPrev = "next" | "prev";

/**
 * Return the next or previous step relative to the given pathname.
 */
export function getRelativeStep<T extends BaseProgressStepRoute>(
  pathname: string,
  which: NextOrPrev,
  steps: T[]
): T | null {
  const currIndex = getStepIndexForPathname(pathname, steps);
  if (currIndex === -1) {
    return null;
  }
  let relIndex = currIndex + (which === "next" ? 1 : -1);
  return steps[relIndex] || null;
}
