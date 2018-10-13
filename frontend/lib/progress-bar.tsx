import React from 'react';
import autobind from "autobind-decorator";
import { RouteComponentProps, withRouter, Route, Switch } from 'react-router';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

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

/**
 * This component can be used to show a progress bar that
 * represents a series of steps the user is working through,
 * where each step is a route.
 */
export const RouteProgressBar = withRouter((props: RouteProgressBarProps): JSX.Element => {
  const { location } = props;
  const { pathname } = location;
  let numSteps = props.steps.length;
  let currStep = 0;

  props.steps.map((step, i) => {
    if (pathname.indexOf(step.path) === 0) {
      currStep = i + 1;
    }
  });

  const pct = Math.floor((currStep / numSteps) * 100);

  return (
    <React.Fragment>
      <ProgressBar pct={pct}>
        {props.label} step {currStep} of {numSteps}
      </ProgressBar>
      <TransitionGroup className="jf-progress-step-wrapper">
        <CSSTransition key={currStep} classNames="jf-progress-step" timeout={JF_PROGRESS_TRANSITION_MS}>
          <Switch location={location}>
            {props.steps.map(step => <Route key={step.path} {...step} />)}
          </Switch>
        </CSSTransition>
      </TransitionGroup>
    </React.Fragment>
  );
});
