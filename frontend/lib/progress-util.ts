import { matchPath } from "react-router";

export type StepRouteInfo = {
  path: string,
  exact?: boolean
};

export function getStepIndexForPathname(pathname: string, steps: StepRouteInfo[]): number {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const { path, exact } = step;
    const match = matchPath(pathname, { path, exact });
    if (match) {
      return i;
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(`Path ${pathname} is not a valid step!`);
  }

  return -1;
}
