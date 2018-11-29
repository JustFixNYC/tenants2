import React from 'react';

import { SessionProgressStepRoute, RedirectToLatestStep } from "./progress-redirection";
import { Switch, Route, RouteProps } from "react-router";
import { RouteProgressBar } from './progress-bar';

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

export function ProgressRoutes(props: ProgressRoutesProps): JSX.Element {
  return (
    <Switch>
      {generateRoutes(props).map((routeProps, i) => <Route key={i} {...routeProps} />)}
    </Switch>
  );
}

export function buildProgressRoutesComponent(props: ProgressRoutesProps): () => JSX.Element {
  return () => <ProgressRoutes {...props}/>;
}
