import React from "react";
import autobind from "autobind-decorator";
import { RouteComponentProps, withRouter, Switch } from "react-router";
import { CSSTransition } from "react-transition-group";
import { TransitionContextGroup } from "../ui/transition-context";
import classnames from "classnames";
import { getStepIndexForPathname } from "./progress-util";
import { li18n } from "../i18n-lingui";
import { t } from "@lingui/macro";
import {
  ProgressStepRoute,
  createStepRoute,
  ProgressStepDefaults,
} from "./progress-step-route";

/**
 * This value must be mirrored in our SCSS by a similarly-named constant,
 * $jf-progress-transition-ms.
 */
export const JF_PROGRESS_TRANSITION_MS = 1000;

interface ProgressBarState {
  pct: number;
}

export interface ProgressBarProps {
  pct: number;
  children?: any;
}

function isInternetExplorer(): boolean {
  return /trident/i.test(navigator.userAgent);
}

/** An animated progress bar component. */
export class ProgressBar extends React.Component<
  ProgressBarProps,
  ProgressBarState
> {
  animationRequest: number | null = null;

  constructor(props: ProgressBarProps) {
    super(props);
    this.state = { pct: props.pct };
  }

  scheduleAnimate() {
    if (this.animationRequest !== null) return;
    this.animationRequest = window.requestAnimationFrame(this.animate);
  }

  @autobind
  animate() {
    this.animationRequest = null;
    if (this.state.pct === this.props.pct) return;
    const increment = this.state.pct < this.props.pct ? 1 : -1;
    this.setState({ pct: this.state.pct + increment });
    this.scheduleAnimate();
  }

  componentDidMount() {
    this.scheduleAnimate();
  }

  componentDidUpdate(prevProps: ProgressBarProps) {
    if (prevProps.pct !== this.props.pct) {
      this.scheduleAnimate();
    }
  }

  componentWillUnmount() {
    if (this.animationRequest !== null) {
      window.cancelAnimationFrame(this.animationRequest);
      this.animationRequest = null;
    }
  }

  render() {
    return (
      <div className="jf-progress-title-wrapper">
        {this.props.children}
        <progress
          className="progress is-primary"
          value={this.state.pct}
          max="100"
        ></progress>
      </div>
    );
  }
}

interface RouteProgressBarProps extends RouteComponentProps<any> {
  /** The steps represented by the progress bar. */
  steps: ProgressStepRoute[];

  /**
   * If the progress bar represents part of a larger step-based flow, those
   * "outer steps" can be provided here.
   */
  outerSteps?: ProgressStepRoute[];

  /**
   * The human-readable label for the progress bar. If absent, no label
   * will be shown, as will no "step X of Y" text.
   */
  label?: string;

  /** If true, hide the actual progress bar but still render the routes. */
  hideBar?: boolean;

  /** Defaults to apply to every step. */
  defaults?: ProgressStepDefaults;

  /**
   * When defined, this relabels the progress bar with a new label for a certain
   * number of steps at the start of the `stepsToFillOut` list.
   *
   * The two array elements are defined as follows:
   * - first element is the label for this introductory section of the progress steps
   * - second element is the number of steps this introductory section accounts for
   */
  introProgressSection?: IntroProgressSection;
}

export interface IntroProgressSection {
  label: string;
  num_steps: number;
}

interface RouteProgressBarState {
  currStep: number;
  prevStep: number;
  isTransitionEnabled: boolean;
}

class RouteProgressBarWithoutRouter extends React.Component<
  RouteProgressBarProps,
  RouteProgressBarState
> {
  constructor(props: RouteProgressBarProps) {
    super(props);
    this.state = {
      currStep: this.getStep(props.location.pathname),
      prevStep: 0,
      isTransitionEnabled: true,
    };
  }

  private getStep(pathname: string): number {
    return getStepIndexForPathname(pathname, this.props.steps, true) + 1;
  }

  componentDidMount() {
    // For some bizarre reason our CSS transition doesn't work on IE11 (the exit transition
    // triggers, but the enter transition doesn't) so we'll just disable it entirely if we're
    // on that browser.
    if (isInternetExplorer()) {
      this.setState({ isTransitionEnabled: false });
    }
  }

  componentDidUpdate(
    prevProps: RouteProgressBarProps,
    prevState: RouteProgressBarState
  ) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      const currStep = this.getStep(this.props.location.pathname);
      if (this.state.currStep !== currStep) {
        const prevStep = this.getStep(prevProps.location.pathname);
        this.setState({ currStep, prevStep });
      }
    }
  }

  render() {
    const { props } = this;
    const { location, introProgressSection, label } = props;
    const { isTransitionEnabled } = this.state;
    let numSteps = props.steps.length;
    let currStep = this.getStep(location.pathname);
    let prevStep = this.state.prevStep;
    let hideBar = props.steps[currStep - 1]?.hideProgressBar || false;

    if (currStep !== this.state.currStep) {
      // We're in the phase while we're rendering but before componentDidUpdate() has been called,
      // or at least before its setState() calls have taken effect.
      prevStep = this.state.currStep;
    }

    let directionClass =
      currStep >= prevStep ? "jf-progress-forward" : "jf-progress-backward";

    let flowLabel = label;

    let currStepInSection, numStepsInSection;

    // Redefine current and total step count if we have an intro progress section to account for
    if (!!introProgressSection) {
      const introLabel = introProgressSection.label;
      const numIntroSteps = introProgressSection.num_steps;
      if (this.state.currStep <= numIntroSteps) {
        flowLabel = introLabel;
        numStepsInSection = numIntroSteps;
      } else {
        currStepInSection = currStep - numIntroSteps;
        numStepsInSection = numSteps - numIntroSteps;
      }
    }

    let pct = Math.floor(
      ((currStepInSection || currStep) / (numStepsInSection || numSteps)) * 100
    );

    let stepLabel = li18n._(
      t`Step ${currStepInSection || currStep} of ${
        numStepsInSection || numSteps
      }`
    );

    return (
      <React.Fragment>
        {!hideBar && (
          <ProgressBar pct={pct}>
            {flowLabel && (
              <h6 className="jf-page-steps-title title is-6 has-text-grey has-text-centered">
                {flowLabel}: {stepLabel}
              </h6>
            )}
          </ProgressBar>
        )}
        <TransitionContextGroup
          className={classnames("jf-progress-step-wrapper", directionClass, {
            "jf-progress-animation-is-disabled": !isTransitionEnabled,
          })}
        >
          <CSSTransition
            key={currStep}
            classNames="jf-progress-step"
            timeout={JF_PROGRESS_TRANSITION_MS}
            enter={isTransitionEnabled}
            exit={isTransitionEnabled}
          >
            <Switch location={location}>
              {props.steps.map((step) =>
                createStepRoute({
                  key: step.path,
                  step,
                  allSteps: props.outerSteps || props.steps,
                  defaults: props.defaults || {},
                })
              )}
            </Switch>
          </CSSTransition>
        </TransitionContextGroup>
      </React.Fragment>
    );
  }
}

/**
 * This component can be used to show a progress bar that
 * represents a series of steps the user is working through,
 * where each step is a route.
 */
export const RouteProgressBar = withRouter(RouteProgressBarWithoutRouter);
