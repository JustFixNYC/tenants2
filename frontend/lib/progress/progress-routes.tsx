import React from "react";

import { RedirectToLatestStep } from "./progress-redirection";
import { Switch, Route } from "react-router";
import { RouteProgressBar } from "./progress-bar";
import {
  createStepRoute,
  ProgressStepRoute,
  ProgressStepDefaults,
} from "./progress-step-route";

/**
 * These props make it easy to define user flows that correspond to
 * actions the user may need to complete in one sitting. They
 * typically consist of one or more introductory "welcome" steps,
 * followed by steps the user needs to fill out information for,
 * followed by one or more confirmation steps.
 */
export type ProgressRoutesProps = ProgressStepDefaults & {
  /**
   * The route that, when visited, will redirect the user to the most
   * recently completed step in the flow.
   */
  toLatestStep: string;

  /**
   * The name of the whole flow. It should generally be named such that
   * "{label}: Step x of y" makes sense, but if not provided, no
   * such label will be shown.
   */
  label?: string;

  /**
   * The steps that welcome the user to the flow, but that we won't
   * display a progress bar for.
   */
  welcomeSteps: ProgressStepRoute[];

  /**
   * The steps that the user needs to fill out or otherwise provide
   * some input for. We will display a progress bar for these.
   *
   * The length of this array is where "y" comes from when we
   * show "Step x of y" text to the user.
   */
  stepsToFillOut: ProgressStepRoute[];

  /**
   * The steps that confirm the completion of the flow,
   * let the user know what will happen in the short/long term,
   * and so on. We won't display a progress bar for these.
   */
  confirmationSteps: ProgressStepRoute[];

  /**
   * When defined, this relabels the progress bar with a new label for a certain
   * number of steps at the start of the `stepsToFillOut` list.
   *
   * The two array elements are defined as follows:
   * - first element is the label for this introductory section of the progress steps
   * - second element is the number of steps this introductory section accounts for
   */
  introProgressSection?: [string, number];
};

export function getAllSteps(props: ProgressRoutesProps): ProgressStepRoute[] {
  return [
    ...props.welcomeSteps,
    ...props.stepsToFillOut,
    ...props.confirmationSteps,
  ];
}

function createRoutesForSteps(
  steps: ProgressStepRoute[],
  allSteps: ProgressStepRoute[],
  keyPrefix: string,
  options: ProgressRoutesProps
) {
  return steps.map((step, i) => {
    return createStepRoute({
      key: keyPrefix + i,
      step,
      allSteps,
      defaults: options,
    });
  });
}

function generateRoutes(props: ProgressRoutesProps): JSX.Element[] {
  const allSteps = getAllSteps(props);

  return [
    <Route
      key="toLatestStep"
      path={props.toLatestStep}
      exact
      render={() => <RedirectToLatestStep steps={allSteps} />}
    />,
    ...createRoutesForSteps(props.welcomeSteps, allSteps, "welcome", props),
    ...createRoutesForSteps(
      props.confirmationSteps,
      allSteps,
      "confirmation",
      props
    ),
    <Route
      key="progressBar"
      render={() => {
        return (
          <RouteProgressBar
            label={props.label}
            steps={props.stepsToFillOut}
            introProgressSection={props.introProgressSection}
            outerSteps={allSteps}
            defaults={props}
          />
        );
      }}
    />,
  ];
}

export function ProgressRoutes(props: ProgressRoutesProps): JSX.Element {
  return <Switch>{generateRoutes(props)}</Switch>;
}

export function buildProgressRoutesComponent(
  getProps: () => ProgressRoutesProps
): () => JSX.Element {
  return () => <ProgressRoutes {...getProps()} />;
}
