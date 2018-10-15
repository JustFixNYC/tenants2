import React from 'react';
import autobind from "autobind-decorator";
import { RouteComponentProps, withRouter, Route, Switch } from 'react-router';
import { CSSTransition } from 'react-transition-group';
import { TransitionContextGroup } from './transition-context';

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

/** An animated progress bar component. */
export class ProgressBar extends React.Component<ProgressBarProps, ProgressBarState> {
  animationRequest: number|null = null;

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
    this.animationRequest = null
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
      <progress className="progress is-primary" value={this.state.pct} max="100">
        {this.props.children || `${this.state.pct}%`}
      </progress>
    );
  }
}

export interface ProgressStepRoute {
  component: React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any>;
  exact?: boolean;
  path: string;
}

interface RouteProgressBarProps extends RouteComponentProps<any> {
  steps: ProgressStepRoute[];
  label: string;
}

interface RouteProgressBarState {
  currStep: number;
  prevStep: number;
}

export function getStepForPathname(pathname: string, steps: ProgressStepRoute[]) {
  let currStep = 0;

  steps.map((step, i) => {
    if (pathname.indexOf(step.path) === 0) {
      currStep = i + 1;
    }
  });

  if (currStep === 0 && process.env.NODE_ENV !== 'production') {
    console.warn(`Path ${pathname} is not a valid step!`);
  }

  return currStep;
}

class RouteProgressBarWithoutRouter extends React.Component<RouteProgressBarProps, RouteProgressBarState> {
  constructor(props: RouteProgressBarProps) {
    super(props);
    this.state = {
      currStep: this.getStep(props.location.pathname),
      prevStep: 0
    };
  }

  private getStep(pathname: string): number {
    return getStepForPathname(pathname, this.props.steps);
  }

  componentDidUpdate(prevProps: RouteProgressBarProps, prevState: RouteProgressBarState) {
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
    const { location } = props;
    let numSteps = props.steps.length;
    let currStep = this.getStep(location.pathname);
    const pct = Math.floor((currStep / numSteps) * 100);
    let prevStep = this.state.prevStep;

    if (currStep !== this.state.currStep) {
      // We're in the phase while we're rendering but before componentDidUpdate() has been called,
      // or at least before its setState() calls have taken effect.
      prevStep = this.state.currStep;
    }

    let directionClass = currStep >= prevStep ? 'jf-progress-forward' : 'jf-progress-backward';

    return (
      <React.Fragment>
        <ProgressBar pct={pct}>
          {props.label} step {currStep} of {numSteps}
        </ProgressBar>
        <TransitionContextGroup className={`jf-progress-step-wrapper ${directionClass}`}>
          <CSSTransition key={currStep} classNames="jf-progress-step" timeout={JF_PROGRESS_TRANSITION_MS}>
            <Switch location={location}>
              {props.steps.map(step => <Route key={step.path} {...step} />)}
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
