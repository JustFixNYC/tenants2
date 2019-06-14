import React, { useContext } from 'react';

import { RouteComponentProps, Route } from "react-router";
import { getRelativeStep } from "./progress-util";
import { AllSessionInfo } from './queries/AllSessionInfo';
import { AppContext } from './app-context';

export type BaseProgressStepRoute = {
  /** The route's URL path. */
  path: string;

  /**
   * Whether the URL must match the route's URL path exactly, or whether
   * simply beginning with the route's URL path will result in a match.
   */
  exact?: boolean;

  /**
   * Returns whether or not the user has completed the current step, given the
   * current session.
   */
  isComplete?: (session: AllSessionInfo) => boolean;
};

export type ProgressStepProps = RouteComponentProps<{}> & {
  /** The URL path to the step before the one being rendered, if any. */
  prevStep: string|null,

  /** The URL path to the step after the one being rendered, if any. */
  nextStep: string|null,
};

type ComponentProgressStepRoute = BaseProgressStepRoute & {
  component: React.ComponentType<ProgressStepProps> | React.ComponentType<{}>;
};

type RenderProgressStepRoute = BaseProgressStepRoute & {
  render: (ctx: ProgressStepProps) => JSX.Element;
};

export type ProgressStepRoute = ComponentProgressStepRoute | RenderProgressStepRoute;

type StepInfo = {
  step: ProgressStepRoute,
  allSteps: ProgressStepRoute[]
};

function getBestPrevStep(session: AllSessionInfo, path: string, allSteps: ProgressStepRoute[]): ProgressStepRoute|null {
  const prev = getRelativeStep(path, 'prev', allSteps);
  if (prev && prev.isComplete && !prev.isComplete(session)) {
    // The previous step hasn't been completed, so it's possible that
    // an earlier step decided to skip past it. Keep searching backwards.
    return getBestPrevStep(session, prev.path, allSteps);
  }
  return prev;
}

function ProgressStepRenderer(props: StepInfo & RouteComponentProps<any>) {
  const { step, allSteps, ...routerCtx } = props;
  const { session } = useContext(AppContext);
  const prev = getBestPrevStep(session, step.path, allSteps);
  const next = getRelativeStep(step.path, 'next', allSteps);
  const ctx: ProgressStepProps = {
    ...routerCtx,
    prevStep: prev && prev.path,
    nextStep: next && next.path
  };
  if ('component' in step) {
    return <step.component {...ctx} />;
  } else {
    return step.render(ctx);
  }
}

/**
 * Creates a <Route> that renders the given progress step, in the
 * context of other steps.
 * 
 * Ordinarily this might be a component, but since <Switch> requires
 * its immediate descendants to be <Route> components, we can't do that.
 */
export function createStepRoute(options: { key: string, step: ProgressStepRoute, allSteps: ProgressStepRoute[] }) {
  const { step, allSteps } = options;
  return <Route key={options.key} render={(routerCtx) => {
    return <ProgressStepRenderer step={step} allSteps={allSteps} {...routerCtx} />;
  }} path={step.path} exact={step.exact} />
}
