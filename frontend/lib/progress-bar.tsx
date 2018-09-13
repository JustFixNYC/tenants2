import React from 'react';
import autobind from "autobind-decorator";
import { RouteComponentProps, withRouter, Route, RouteProps, Switch } from 'react-router';

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

  render() {
    return (
      <progress className="progress is-info" value={this.state.pct} max="100">
        {this.props.children || `${this.state.pct}%`}
      </progress>
    );
  }
}

interface RouteProgressBarProps extends RouteComponentProps<any> {
  children: React.ReactNode;
  label: string;
}

function childIsRoute(child: React.ReactChild): child is React.ReactElement<RouteProps> {
  return !!child && typeof(child) === 'object' && child.type === Route;
}

/**
 * This component can be used to show a progress bar that
 * represents a series of steps the user is working through,
 * where each step is a route.
 * 
 * The routes should be children of this element.
 */
export const RouteProgressBar = withRouter((props: RouteProgressBarProps): JSX.Element => {
  const { pathname } = props.location;
  let numSteps = 0;
  let currStep = 0;

  React.Children.map(props.children, (child, i) => {
    if (childIsRoute(child) && child.props.path) {
      numSteps += 1;
      if (pathname.indexOf(child.props.path) === 0) {
        currStep = numSteps;
      }
    }
  });

  const pct = Math.floor((currStep / numSteps) * 100);

  return (
    <React.Fragment>
      <ProgressBar pct={pct}>
        {props.label} step {currStep} of {numSteps}
      </ProgressBar>
      <Switch>
        {props.children}
      </Switch>
    </React.Fragment>
  );
});
