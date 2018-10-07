import React from 'react';
import Loadable from 'react-loadable';
import Page from './page';
import autobind from 'autobind-decorator';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

export const IMPERCEPTIBLE_MS = 16;
export const FRIENDLY_LOAD_MS = 1000;

/**
 * This value must be mirrored in our SCSS by a similarly-named constant,
 * $jf-loading-fade-ms.
 */
export const JF_LOADING_FADE_MS = 500;

interface LoadingPageContextType {
  onLoadStart: () => void;
  onLoadStop: () => void;
}

export const LoadingPageContext = React.createContext<LoadingPageContextType>({
  onLoadStart() {},
  onLoadStop() {}
});

export function LoadingPage(props: Loadable.LoadingComponentProps): JSX.Element {
  if (props.error) {
    return (<Page title="Network error">
      <p>Unfortunately, a network error occurred.</p>
      <br />
      <button className="button" onClick={props.retry}>Retry</button>
    </Page>);
  }
  return (
    <Page title="Loading...">
      <h1 className="jf-sr-only">Loading...</h1>
      <LoadingPageContext.Consumer>
        {(ctx) => <LoadingPageSignaler {...ctx} />}
      </LoadingPageContext.Consumer>
    </Page>
  );
}

export class LoadingPageSignaler extends React.Component<LoadingPageContextType> {
  componentDidMount() {
    this.props.onLoadStart();
  }
  
  componentWillUnmount() {
    this.props.onLoadStop();
  }

  render() {
    return null;
  }
}

interface LoadingOverlayManagerState {
  showOverlay: boolean;
}

interface LoadingOverlayManagerProps {
  children: any;
}

export class LoadingOverlayManager extends React.Component<LoadingOverlayManagerProps, LoadingOverlayManagerState> {
  state: LoadingOverlayManagerState;
  loadingPageContext: LoadingPageContextType;

  constructor(props: LoadingOverlayManagerProps) {
    super(props);
    this.state = {
      showOverlay: false
    };
    this.loadingPageContext = {
      onLoadStart: this.handleLoadStart,
      onLoadStop: this.handleLoadStop
    };
  }

  @autobind
  handleLoadStart() {
    this.setState({ showOverlay: true });
  }

  @autobind
  handleLoadStop() {
    this.setState({ showOverlay: false });
  }

  render() {
    return (
      <>
      <TransitionGroup component={null}>
        <CSSTransition key={this.state.showOverlay.toString()} classNames="jf-loading" timeout={JF_LOADING_FADE_MS}>
          <LoadingOverlay show={this.state.showOverlay} />
        </CSSTransition>
      </TransitionGroup>
      <LoadingPageContext.Provider value={this.loadingPageContext}>
        {this.props.children}
      </LoadingPageContext.Provider>
      </>
    );
  }
}

interface LoadingOverlayProps {
  show: boolean;
}

function LoadingOverlay(props: LoadingOverlayProps): JSX.Element|null {
  if (!props.show) {
    return null;
  }

  return (
    <div className="jf-loading-overlay-wrapper" aria-hidden="true">
      <div className="jf-loading-overlay">
        <h1 className="jf-loading-message">Loading&hellip;</h1>
        <div className="jf-loader"/>
      </div>
    </div>
  );
}

export function friendlyLoad<T>(promise: Promise<T>): Promise<T> {
  if (typeof (window) === 'undefined') {
    return promise;
  }

  const start = Date.now();

  return new Promise<T>((resolve) => {
    promise.finally(() => {
      const timeElapsed = Date.now() - start;
      if (timeElapsed < IMPERCEPTIBLE_MS || timeElapsed >= FRIENDLY_LOAD_MS) {
        resolve(promise);
      } else {
        const ms = FRIENDLY_LOAD_MS - timeElapsed;
        window.setTimeout(() => resolve(promise), ms);
      }
    });
  });
}
