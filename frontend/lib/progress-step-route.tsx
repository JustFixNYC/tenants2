import React from 'react';

import { RouteComponentProps, Route } from "react-router";
import { getRelativeStep } from "./progress-util";

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
    const prev = getRelativeStep(step.path, 'prev', allSteps);
    const next = getRelativeStep(step.path, 'next', allSteps);
    const ctx: ProgressStepProps = {
      ...routerCtx,
      prevStep: prev && prev.path,
      nextStep: next && next.path
    };
    if ('component' in options.step) {
      return <options.step.component {...ctx} />;
    } else {
      return options.step.render(ctx);
    }
  }} path={step.path} exact={step.exact} />
}
