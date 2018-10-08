import React from 'react';
import Loadable from 'react-loadable';
import Page from './page';
import autobind from 'autobind-decorator';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { RouteComponentProps, withRouter } from 'react-router';

export const IMPERCEPTIBLE_MS = 16;
export const FRIENDLY_LOAD_MS = 1000;

/**
 * This value must be mirrored in our SCSS by a similarly-named constant,
 * $jf-loading-fade-ms.
 */
export const JF_LOADING_FADE_MS = 500;

/**
 * This attribute will be present on the page's <html> element
 * if a loading page transition is in effect.
 */
export const HTML_LOADING_ATTR = 'data-jf-is-loading';

interface LoadingPageContextType {
  onLoadStart: () => void;
  onLoadStop: () => void;
}

const NullLoadingPageContext: LoadingPageContextType = {
  onLoadStart() {},
  onLoadStop() {},
};

export const LoadingPageContext = React.createContext<LoadingPageContextType>(NullLoadingPageContext);

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

type LoadingOverlayManagerSnapshot = { div: HTMLDivElement, scroll: number }|null;

interface LoadingOverlayManagerState {
  showOverlay: boolean;
}

interface LoadingOverlayManagerProps extends RouteComponentProps<any> {
  render: (props: RouteComponentProps<any>) => JSX.Element;
}

class LoadingOverlayManagerWithoutRouter extends React.Component<LoadingOverlayManagerProps, LoadingOverlayManagerState, LoadingOverlayManagerSnapshot> {
  state: LoadingOverlayManagerState;
  loadingPageContext: LoadingPageContextType;
  childrenRef: React.RefObject<HTMLDivElement>;
  latestSnapshotRef: React.RefObject<HTMLDivElement>;

  constructor(props: LoadingOverlayManagerProps) {
    super(props);
    this.state = {
      showOverlay: false,
    };
    this.loadingPageContext = {
      onLoadStart: this.handleLoadStart,
      onLoadStop: this.handleLoadStop,
    };
    this.childrenRef = React.createRef();
    this.latestSnapshotRef = React.createRef();
  }

  getSnapshotBeforeUpdate(prevProps: LoadingOverlayManagerProps): LoadingOverlayManagerSnapshot {
    if (prevProps.location !== this.props.location && this.childrenRef.current) {
      return {
        div: this.childrenRef.current.cloneNode(true) as HTMLDivElement,
        scroll: window.scrollY
      }
    }
    return null;
  }

  componentDidUpdate(prevProps: LoadingOverlayManagerProps, prevState: LoadingOverlayManagerState, snapshot: LoadingOverlayManagerSnapshot) {
    if (prevProps.location !== this.props.location &&
        document.documentElement.hasAttribute(HTML_LOADING_ATTR)) {
      const div = this.latestSnapshotRef.current;
      if (div && snapshot) {
        div.innerHTML = '';
        div.appendChild(snapshot.div);
        window.requestAnimationFrame(() => {
          window.scroll({ top: snapshot.scroll, left: 0, behavior: 'instant' });
        });
      }
    }
  }

  @autobind
  handleLoadStart() {
    document.documentElement.setAttribute(HTML_LOADING_ATTR, '');
    this.setState({ showOverlay: true });
  }

  @autobind
  handleLoadStop() {
    document.documentElement.removeAttribute(HTML_LOADING_ATTR);
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
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
        <div ref={this.childrenRef}>{this.props.render(this.props)}</div>
        <div ref={this.latestSnapshotRef} hidden={!this.state.showOverlay}></div>
      </LoadingPageContext.Provider>
      </>
    );
  }
}

export const LoadingOverlayManager = withRouter(LoadingOverlayManagerWithoutRouter);

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
