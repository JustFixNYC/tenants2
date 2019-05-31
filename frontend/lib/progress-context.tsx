import React, { useContext } from 'react';

import { SessionProgressStepRoute } from "./progress-redirection";
import { RouteComponentProps, Route, withRouter } from "react-router";
import { getStepForPathname } from './progress-bar';

export interface ProgressContextType {
  nextStep: SessionProgressStepRoute|null,
  prevStep: SessionProgressStepRoute|null
}

const DEFAULT_CONTEXT: ProgressContextType = { nextStep: null, prevStep: null };

function buildProgressContext(
  steps: SessionProgressStepRoute[],
  currentPath: string
): ProgressContextType {
  const index = getStepForPathname(currentPath, steps) - 1;
  const ctx: ProgressContextType = { ...DEFAULT_CONTEXT };

  if (index >= 0) {
    ctx.prevStep = steps[index - 1] || null;
    ctx.nextStep = steps[index + 1] || null;
  }

  return ctx;
}

export function RouteWithProgressContext(
  props: { render: (ctx: ProgressContextType & RouteComponentProps<any>) => JSX.Element }
): JSX.Element {
  const progCtx = useContext(ProgressContext);

  return <Route render={(routeCtx) => props.render({ ...routeCtx, ...progCtx })}/>;
}

export const ProgressContext = React.createContext<ProgressContextType>(DEFAULT_CONTEXT);

type ProgressContextProviderProps = RouteComponentProps<any> & {
  steps: SessionProgressStepRoute[],
  children: any
};

export const ProgressContextProvider = withRouter((props: ProgressContextProviderProps) => (
  <ProgressContext.Provider
    value={buildProgressContext(props.steps, props.location.pathname)}
    children={props.children} />
));
