import React, { useContext } from 'react';

import { SessionProgressStepRoute } from "./progress-redirection";
import { getStepIndexForPathname } from './progress-util';
import { RouteComponentProps, Route } from 'react-router';
import { buildContextHocFactory } from './context-util';

export type NextOrPrev = 'next'|'prev';

export class ProgressContextObject {
  constructor(readonly steps: readonly SessionProgressStepRoute[] = []) {
  }

  getRelativeStep(pathname: string, which: NextOrPrev): SessionProgressStepRoute|null {
    const currIndex = getStepIndexForPathname(pathname, this.steps);
    if (currIndex === -1) {
      return null;
    }
    let relIndex = currIndex + (which === 'next' ? 1 : -1);
    return this.steps[relIndex] || null;
  }

  getRelativeStepStrict(pathname: string, which: NextOrPrev): SessionProgressStepRoute {
    const step = this.getRelativeStep(pathname, which);
    if (!step) {
      throw new Error(`No ${which} step from ${pathname} (${this.steps.length} steps total)`);
    }
    return step;
  }
}

export interface ProgressContextType {
  progress: ProgressContextObject;
}

const EMPTY_PROGRESS_CONTEXT: ProgressContextType = {
  progress: new ProgressContextObject()
};

export const ProgressContext = React.createContext<ProgressContextType>(EMPTY_PROGRESS_CONTEXT);

export const withProgressContext = buildContextHocFactory(ProgressContext);

export const useProgressContext = () => useContext(ProgressContext).progress;

export function ProgressContextProvider(props: {
  steps: readonly SessionProgressStepRoute[],
  children: any
}) {
  const progress = new ProgressContextObject(props.steps);

  return <ProgressContext.Provider value={{ progress }} children={props.children} />
}

export function RouteWithProgressContext(
  props: { render: (ctx: ProgressContextType & RouteComponentProps<any>) => JSX.Element }
): JSX.Element {
  const progCtx = useContext(ProgressContext);

  return <Route render={(routeCtx) => props.render({ ...routeCtx, ...progCtx })} />;
}
