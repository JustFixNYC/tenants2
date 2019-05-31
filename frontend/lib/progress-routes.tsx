import React from 'react';

import { SessionProgressStepRoute, RedirectToLatestStep } from "./progress-redirection";
import { Switch, Route, RouteProps, withRouter, RouteComponentProps } from "react-router";
import { RouteProgressBar } from './progress-bar';
import { getOneDirLevelUp } from './modal';

/**
 * These props make it easy to define user flows that correspond to
 * actions the user may need to complete in one sitting. They
 * typically consist of one or more introductory "welcome" steps,
 * followed by steps the user needs to fill out information for,
 * followed by one or more confirmation steps.
 */
export type ProgressRoutesProps = {
  /**
   * The route that, when visited, will redirect the user to the most
   * recently completed step in the flow.
   */
  toLatestStep: string;

  /**
   * The name of the whole flow. It should generally be named such that
   * "{label}: Step x of y" makes sense.
   */
  label: string;

  /**
   * The steps that welcome the user to the flow, but that we won't
   * display a progress bar for.
   */
  welcomeSteps: SessionProgressStepRoute[],

  /**
   * The steps that the user needs to fill out or otherwise provide
   * some input for. We will display a progress bar for these.
   * 
   * The length of this array is where "y" comes from when we
   * show "Step x of y" text to the user.
   */
  stepsToFillOut: SessionProgressStepRoute[],

  /**
   * The steps that confirm the completion of the flow,
   * let the user know what will happen in the short/long term,
   * and so on. We won't display a progress bar for these.
   */
  confirmationSteps: SessionProgressStepRoute[],
};

export function getAllSteps(props: ProgressRoutesProps): SessionProgressStepRoute[] {
  return [
    ...props.welcomeSteps,
    ...props.stepsToFillOut,
    ...props.confirmationSteps
  ];
}

function generateRoutes(props: ProgressRoutesProps): RouteProps[] {
  return [
    {
      path: props.toLatestStep,
      exact: true,
      render: () => <RedirectToLatestStep steps={getAllSteps(props)} />
    },
    ...props.welcomeSteps,
    ...props.confirmationSteps,
    {
      render: () => <RouteProgressBar label={props.label} steps={props.stepsToFillOut} />
    }
  ];
}

interface ProgressRoutesContextType {
  nextStep?: SessionProgressStepRoute,
  prevStep?: SessionProgressStepRoute
}

function buildProgressRoutesContext(
  steps: SessionProgressStepRoute[],
  currentPathname: string
): ProgressRoutesContextType {
  const stepPathnames = steps.map(step => step.path);
  let index = stepPathnames.indexOf(currentPathname);

  if (index === -1) {
    index = stepPathnames.indexOf(getOneDirLevelUp(currentPathname));
  }

  const ctx: ProgressRoutesContextType = {};

  if (index >= 0) {
    ctx.prevStep = steps[index - 1];
    ctx.nextStep = steps[index + 1];
  }

  return ctx;
}

export const ProgressRoutesContext = React.createContext<ProgressRoutesContextType>({});

export const ProgressRoutes = withRouter((props: ProgressRoutesProps & RouteComponentProps<any>) => {
  const ctx = buildProgressRoutesContext(getAllSteps(props), props.location.pathname);

  return (
    <ProgressRoutesContext.Provider value={ctx}>
      <Switch>
        {generateRoutes(props).map((routeProps, i) => <Route key={i} {...routeProps} />)}
      </Switch>
    </ProgressRoutesContext.Provider>
  );
});

export function buildProgressRoutesComponent(getProps: () => ProgressRoutesProps): () => JSX.Element {
  return () => <ProgressRoutes {...getProps()}/>;
}
