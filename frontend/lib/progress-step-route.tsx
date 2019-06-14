import React, { useContext } from 'react';

import { RouteComponentProps, Route } from "react-router";
import { getRelativeStep } from "./progress-util";
import { AppContext } from './app-context';

export type BaseProgressStepRoute = {
  exact?: boolean;
  path: string;
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

function ProgressStepRenderer(props: StepInfo & RouteComponentProps<any>) {
  const { step, allSteps, ...routerCtx } = props;
  const prev = getRelativeStep(step.path, 'prev', allSteps);
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
