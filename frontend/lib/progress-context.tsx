import React, { useContext } from 'react';

import { SessionProgressStepRoute } from "./progress-redirection";
import { RouteComponentProps, Route, withRouter } from "react-router";
import { getStepIndexForPathname } from './progress-util';
import { Location } from 'history';

export interface ProgressContextType {
  allSteps: SessionProgressStepRoute[],
  currStep: SessionProgressStepRoute|null,
  nextStep: SessionProgressStepRoute|null,
  prevStep: SessionProgressStepRoute|null
}

export const EMPTY_PROGRESS_CONTEXT: ProgressContextType = {
  allSteps: [],
  currStep: null,
  nextStep: null,
  prevStep: null,
};

function buildProgressContext(
  allSteps: SessionProgressStepRoute[],
  currentPath: string
): ProgressContextType {
  const index = getStepIndexForPathname(currentPath, allSteps);
  const ctx: ProgressContextType = { ...EMPTY_PROGRESS_CONTEXT, allSteps };

  if (index >= 0) {
    ctx.currStep = allSteps[index];
    ctx.prevStep = allSteps[index - 1] || null;
    ctx.nextStep = allSteps[index + 1] || null;
  }

  return ctx;
}

type ChangeProgressContextProps = {
  location: Location<any>,
  children: any
};

export function ChangeProgressContext(props: ChangeProgressContextProps): JSX.Element {
  const progCtx = useContext(ProgressContext);

  return (
    <ProgressContext.Provider
      value={buildProgressContext(progCtx.allSteps, props.location.pathname)}
      children={props.children} />
  );
}

export function RouteWithProgressContext(
  props: { render: (ctx: ProgressContextType & RouteComponentProps<any>) => JSX.Element }
): JSX.Element {
  const progCtx = useContext(ProgressContext);

  return <Route render={(routeCtx) => props.render({ ...routeCtx, ...progCtx })}/>;
}

export const ProgressContext = React.createContext<ProgressContextType>(EMPTY_PROGRESS_CONTEXT);

type ProgressContextProviderProps = RouteComponentProps<any> & {
  steps: SessionProgressStepRoute[],
  children: any
};

export const ProgressContextProvider = withRouter((props: ProgressContextProviderProps) => (
  <ProgressContext.Provider
    value={buildProgressContext(props.steps, props.location.pathname)}
    children={props.children} />
));
