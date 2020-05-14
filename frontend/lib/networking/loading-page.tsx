import React from "react";
import Page from "../ui/page";
import autobind from "autobind-decorator";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { RouteComponentProps, withRouter } from "react-router";
import { smoothlyScrollToTopOfPage } from "../util/scrolling";
import { RetryableLoadingComponentProps } from "./loading-component-props";

/**
 * The amount of time, in miliseconds, that we consider "imperceptible".
 * If something takes less than this amount of time to load, we will
 * consider it to be basically instantaneous.
 */
export const IMPERCEPTIBLE_MS = 16;

/**
 * If something takes a perceptible amount of time to load, we want
 * to inform the user that loading is happening--but we also want
 * to avoid jank and confusion by ensuring that the loading transition
 * doesn't simply flicker in and out of existence before the user has
 * time to register it.
 *
 * So we'll ensure that the loading indicator is visible for a minimum
 * amount of time, called the "friendly load time", before disappearing.
 */
let friendlyLoadMs = 1000;

/**
 * This value must be mirrored in our SCSS by a similarly-named constant,
 * $jf-loading-fade-ms.
 */
export const JF_LOADING_FADE_MS = 500;

/**
 * This is a React context that gives components further down in the
 * heirarchy a way to inform us that they are loading something, and
 * that a loading page many be need to be shown.
 */
interface LoadingPageContextType {
  /**
   * Callback to call when a component has started loading a resource
   * that we may need a loading screen for. */
  onLoadStart: () => void;

  /**
   * Callback to call when a component is finished loading a resource,
   * and is ready to be shown.
   */
  onLoadStop: () => void;
}

const NullLoadingPageContext: LoadingPageContextType = {
  onLoadStart() {},
  onLoadStop() {},
};

export const LoadingPageContext = React.createContext<LoadingPageContextType>(
  NullLoadingPageContext
);

/**
 * A loading page interstitial, which also presents a retry UI in the case
 * of network errors.
 *
 * The actual visuals are managed by a component further up the heirarchy,
 * to ensure that visual transitions are smooth.
 */
export function LoadingPageWithRetry(
  props: RetryableLoadingComponentProps
): JSX.Element {
  if (props.error) {
    return (
      <Page title="Network error">
        <p>Unfortunately, a network error occurred.</p>
        <br />
        <button className="button" onClick={props.retry}>
          Retry
        </button>
      </Page>
    );
  }
  return <LoadingPage />;
}

/**
 * A loading page interstitial.
 */
export function LoadingPage(props: {}): JSX.Element {
  return (
    <Page title="Loading...">
      <h1 className="jf-sr-only">Loading...</h1>
      <LoadingPageContext.Consumer>
        {(ctx) => <LoadingPageSignaler {...ctx} />}
      </LoadingPageContext.Consumer>
    </Page>
  );
}

/**
 * This is a trivial component that just informs us that a
 * resource is being loaded for the duration of the component's
 * lifetime. It doesn't actually render anything.
 */
export class LoadingPageSignaler extends React.Component<
  LoadingPageContextType
> {
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

type LoadingOverlayManagerSnapshot = {
  div: HTMLDivElement;
  scroll: number;
} | null;

interface LoadingOverlayManagerState {
  showOverlay: boolean;
  latestSnapshot: LoadingOverlayManagerSnapshot;
}

interface LoadingOverlayManagerProps extends RouteComponentProps<any> {
  children: any;
}

class LoadingOverlayManagerWithoutRouter extends React.Component<
  LoadingOverlayManagerProps,
  LoadingOverlayManagerState,
  LoadingOverlayManagerSnapshot
> {
  state: LoadingOverlayManagerState;
  loadingPageContext: LoadingPageContextType;
  childrenRef: React.RefObject<HTMLDivElement>;
  latestSnapshotRef: React.RefObject<HTMLDivElement>;

  constructor(props: LoadingOverlayManagerProps) {
    super(props);
    this.state = {
      showOverlay: false,
      latestSnapshot: null,
    };
    this.loadingPageContext = {
      onLoadStart: this.handleLoadStart,
      onLoadStop: this.handleLoadStop,
    };
    this.childrenRef = React.createRef();
    this.latestSnapshotRef = React.createRef();
  }

  /**
   * This is really tricky: because of the way react-router and loadable-components work,
   * it's very hard to know when we'll need a loading transition to occur. By
   * the time we do know, the old page that we want to transition from has
   * actually disappeared!
   *
   * However, React's getSnapshotBeforeUpdate() gives us a way to work around
   * this limitation. If we clone the DOM of the page every time we think
   * there *might* be a transition, we can reuse it if there ends up being
   * a transition, allowing us to keep a visual representation of it around
   * for a bit while the next page is loading.
   */
  getSnapshotBeforeUpdate(
    prevProps: LoadingOverlayManagerProps
  ): LoadingOverlayManagerSnapshot {
    if (
      prevProps.location !== this.props.location &&
      this.childrenRef.current
    ) {
      return {
        div: this.childrenRef.current.cloneNode(true) as HTMLDivElement,
        scroll: window.scrollY,
      };
    }
    return null;
  }

  componentDidUpdate(
    prevProps: LoadingOverlayManagerProps,
    prevState: LoadingOverlayManagerState,
    snapshot: LoadingOverlayManagerSnapshot
  ) {
    if (prevProps.location !== this.props.location) {
      this.setState({ latestSnapshot: snapshot });
    }
    if (prevState.showOverlay === false && this.state.showOverlay === true) {
      // We just started showing the overlay, so make sure that our snapshot of
      // the page we're transitioning from is visible, and in the same scroll
      // position as it was before.
      const div = this.latestSnapshotRef.current;
      if (div && this.state.latestSnapshot) {
        div.innerHTML = "";
        div.appendChild(this.state.latestSnapshot.div);
        window.scroll({
          top: this.state.latestSnapshot.scroll,
          left: 0,
          behavior: "auto",
        });
      }
    } else if (
      prevState.showOverlay === true &&
      this.state.showOverlay === false
    ) {
      // We just stopped showing the overlay, so make sure the top of the page
      // is visible.
      smoothlyScrollToTopOfPage();
    }
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
          <CSSTransition
            key={this.state.showOverlay.toString()}
            classNames="jf-loading"
            timeout={JF_LOADING_FADE_MS}
          >
            <LoadingOverlay show={this.state.showOverlay} />
          </CSSTransition>
        </TransitionGroup>
        <LoadingPageContext.Provider value={this.loadingPageContext}>
          <div ref={this.childrenRef}>{this.props.children}</div>
          <div
            className="jf-is-transitioning-out"
            ref={this.latestSnapshotRef}
            hidden={!this.state.showOverlay}
          ></div>
        </LoadingPageContext.Provider>
      </>
    );
  }
}

export const LoadingOverlayManager = withRouter(
  LoadingOverlayManagerWithoutRouter
);

interface LoadingOverlayProps {
  show: boolean;
}

/** The actual loading overlay visual. */
function LoadingOverlay(props: LoadingOverlayProps): JSX.Element | null {
  if (!props.show) {
    return null;
  }

  return (
    <div className="jf-loading-overlay-wrapper" aria-hidden="true">
      <div className="jf-loading-overlay">
        <div className="jf-loader" />
      </div>
    </div>
  );
}

/**
 * Given a promise that represents a resource that is loading,
 * this function ensures that it resolves (or rejects) within
 * either an imperceptible amount of time, or a friendly amount
 * of time.
 */
export function friendlyLoad<T>(promise: Promise<T>): Promise<T> {
  if (typeof window === "undefined") {
    return promise;
  }

  const start = Date.now();

  return new Promise<T>((resolve) => {
    const finallyCb = () => {
      const timeElapsed = Date.now() - start;
      if (timeElapsed < IMPERCEPTIBLE_MS || timeElapsed >= friendlyLoadMs) {
        resolve(promise);
      } else {
        const ms = friendlyLoadMs - timeElapsed;
        window.setTimeout(() => resolve(promise), ms);
      }
    };
    promise.then(finallyCb).catch(finallyCb);
  });
}

/**
 * Set the friendly load time (that is, the minimum amount of time we'll allow
 * a loading screen to be shown for). This is primarily intended for use
 * during testing, to ensure that tests don't take a long time to run if
 * they happen to involve dynamically loading something.
 */
export function setFriendlyLoadMs(value: number) {
  friendlyLoadMs = value;
}
