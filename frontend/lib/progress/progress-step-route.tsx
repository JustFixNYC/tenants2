import React, { useContext } from "react";

import { RouteComponentProps, Route } from "react-router";
import { getRelativeStep } from "./progress-util";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { AppContext } from "../app-context";
import { assertNotNull } from "@justfixnyc/util";

export type ProgressStepDefaults = {
  /**
   * A component that only takes `children` props which will be
   * used to wrap each step's content by default. Can be overridden
   * on a per-step basis.
   */
  defaultWrapContent?: React.ComponentType<React.PropsWithChildren<{}>>;
};

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

  /**
   * Returns whether or not the step should be skipped, e.g. because a question
   * the user answered earlier obviated the need for it.
   */
  shouldBeSkipped?: (session: AllSessionInfo) => boolean;

  /**
   * This indicates that the step is one that future steps should never
   * link back to.
   */
  neverGoBackTo?: boolean;

  /**
   * A component that only takes `children` props which will be
   * used to wrap the step's content. Set this to `false` to
   * override any value that might be inherited from default settings.
   */
  wrapContent?: React.ComponentType<React.PropsWithChildren<{}>> | false;
};

export type ProgressStepProps = RouteComponentProps<{}> & {
  /** The URL path to the step before the one being rendered, if any. */
  prevStep: string | null;

  /** The URL path to the step after the one being rendered, if any. */
  nextStep: string | null;
};

export type MiddleProgressStepProps = ProgressStepProps & {
  /** The URL path to the step before the one being rendered. */
  prevStep: string;

  /** The URL path to the step after the one being rendered. */
  nextStep: string;
};

/**
 * A simple higher-order component that guarantees, at runtime, that
 * it's a middle step (i.e., that it has both next and previous steps)
 * and passes them on to the component it's wrapping.
 */
export function MiddleProgressStep(
  Component: React.ComponentType<MiddleProgressStepProps>
): React.FunctionComponent<ProgressStepProps> {
  return (props: ProgressStepProps) => {
    let { prevStep, nextStep, ...rest } = props;
    return (
      <Component
        prevStep={assertNotNull(prevStep)}
        nextStep={assertNotNull(nextStep)}
        {...rest}
      />
    );
  };
}

type ComponentProgressStepRoute = BaseProgressStepRoute & {
  component: React.ComponentType<ProgressStepProps> | React.ComponentType<{}>;
};

type RenderProgressStepRoute = BaseProgressStepRoute & {
  render: (ctx: ProgressStepProps) => JSX.Element;
};

export type ProgressStepRoute =
  | ComponentProgressStepRoute
  | RenderProgressStepRoute;

type StepInfo = {
  step: ProgressStepRoute;
  allSteps: ProgressStepRoute[];
  defaults: ProgressStepDefaults;
};

class StepQuerier {
  constructor(
    readonly step: BaseProgressStepRoute,
    readonly session: AllSessionInfo
  ) {}

  get isIncomplete(): boolean {
    return this.step.isComplete ? !this.step.isComplete(this.session) : false;
  }

  get shouldBeSkipped(): boolean {
    return this.step.shouldBeSkipped
      ? this.step.shouldBeSkipped(this.session)
      : false;
  }
}

export function getBestPrevStep(
  session: AllSessionInfo,
  path: string,
  allSteps: ProgressStepRoute[]
): ProgressStepRoute | null {
  const prev = getRelativeStep(path, "prev", allSteps);
  if (prev) {
    const pq = new StepQuerier(prev, session);
    if (pq.isIncomplete || pq.shouldBeSkipped || prev.neverGoBackTo) {
      // The previous step either hasn't been completed, so it's possible that
      // an earlier step decided to skip past it, or it explicitly wants to
      // be skipped. Keep searching backwards.
      return getBestPrevStep(session, prev.path, allSteps);
    }
  }
  return prev;
}

export function getBestNextStep(
  session: AllSessionInfo,
  path: string,
  allSteps: ProgressStepRoute[]
): ProgressStepRoute | null {
  const next = getRelativeStep(path, "next", allSteps);
  if (next) {
    const nq = new StepQuerier(next, session);
    if (nq.shouldBeSkipped) {
      // The next step wants to be skipped. Keep searching.
      return getBestNextStep(session, next.path, allSteps);
    }
  }
  return next;
}

function ProgressStepRenderer(props: StepInfo & RouteComponentProps<any>) {
  const { step, allSteps, defaults, ...routerCtx } = props;
  const { session } = useContext(AppContext);
  const prev = getBestPrevStep(session, step.path, allSteps);
  const next = getBestNextStep(session, step.path, allSteps);
  const ctx: ProgressStepProps = {
    ...routerCtx,
    prevStep: prev && prev.path,
    nextStep: next && next.path,
  };

  const wrapContent = step.wrapContent ?? defaults.defaultWrapContent;

  let el: JSX.Element;
  if ("component" in step) {
    el = <step.component {...ctx} />;
  } else {
    el = step.render(ctx);
  }
  if (wrapContent) {
    const WrapComponent = wrapContent;
    el = <WrapComponent>{el}</WrapComponent>;
  }
  return el;
}

/**
 * Creates a <Route> that renders the given progress step, in the
 * context of other steps.
 *
 * Ordinarily this might be a component, but since <Switch> requires
 * its immediate descendants to be <Route> components, we can't do that.
 */
export function createStepRoute(options: {
  key: string;
  step: ProgressStepRoute;
  allSteps: ProgressStepRoute[];
  defaults: ProgressStepDefaults;
}) {
  const { step, allSteps } = options;
  return (
    <Route
      key={options.key}
      render={(routerCtx) => {
        return (
          <ProgressStepRenderer
            step={step}
            allSteps={allSteps}
            defaults={options.defaults}
            {...routerCtx}
          />
        );
      }}
      path={step.path}
      exact={step.exact}
    />
  );
}
