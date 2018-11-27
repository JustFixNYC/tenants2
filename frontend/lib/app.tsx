import React, { RefObject } from 'react';
import ReactDOM from 'react-dom';
import autobind from 'autobind-decorator';
import { BrowserRouter, Switch, Route, RouteComponentProps, withRouter } from 'react-router-dom';
import Loadable from 'react-loadable';

import GraphQlClient from './graphql-client';

import { AllSessionInfo } from './queries/AllSessionInfo';
import { AppServerInfo, AppContext, AppContextType, AppLegacyFormSubmission } from './app-context';
import { NotFound } from './pages/not-found';
import { LoadingPage, friendlyLoad, LoadingOverlayManager } from "./loading-page";
import { ErrorBoundary } from './error-boundary';
import LoginPage from './pages/login-page';
import { LogoutPage } from './pages/logout-page';
import Routes, { isModalRoute, routeMap } from './routes';
import Navbar from './navbar';
import { AriaAnnouncer } from './aria';
import { trackPageView, ga } from './google-analytics';
import { Action, Location } from 'history';
import { smoothlyScrollToTopOfPage } from './scrolling';
import { HistoryBlockerManager, getNavigationConfirmation } from './history-blocker';


export interface AppProps {
  /** The initial URL to render on page load. */
  initialURL: string;

  /** The initial session state the App was started with. */
  initialSession: AllSessionInfo;

  /** Metadata about the server. */
  server: AppServerInfo;

  /**
   * If a form was manually submitted via a browser that doesn't support JS,
   * the server will have processed the POST data for us and put the
   * results here.
   */
  legacyFormSubmission?: AppLegacyFormSubmission;

  /**
   * If we're on the server-side and there's a modal on the page, we
   * will actually be rendered *twice*: once with the modal background,
   * and again with the modal itself. In the latter case, this prop will
   * be populated with the content of the modal.
   */
  modal?: JSX.Element;
}

export type AppPropsWithRouter = AppProps & RouteComponentProps<any>;

interface AppState {
  /**
   * The current session state of the App, which can
   * be different from the initial session if e.g. the user
   * has logged out since the initial page load.
   */
  session: AllSessionInfo;
}

const LoadableIndexPage = Loadable({
  loader: () => friendlyLoad(import(/* webpackChunkName: "index-page" */ './pages/index-page')),
  loading: LoadingPage
});

const LoadableOnboardingRoutes = Loadable({
  loader: () => friendlyLoad(import(/* webpackChunkName: "onboarding" */ './onboarding')),
  loading: LoadingPage
});

const LoadableLetterOfComplaintRoutes = Loadable({
  loader: () => friendlyLoad(import(/* webpackChunkName: "letter-of-complaint" */ './letter-of-complaint')),
  loading: LoadingPage
});

const LoadableHPActionRoutes = Loadable({
  loader: () => friendlyLoad(import(/* webpackChunkName: "hp-action" */ './hp-action')),
  loading: LoadingPage
});

const LoadableDevRoutes = Loadable({
  loader: () => friendlyLoad(import(/* webpackChunkName: "dev" */ './dev')),
  loading: LoadingPage
});

export class AppWithoutRouter extends React.Component<AppPropsWithRouter, AppState> {
  gqlClient: GraphQlClient;
  pageBodyRef: RefObject<HTMLDivElement>;

  constructor(props: AppPropsWithRouter) {
    super(props);
    this.gqlClient = new GraphQlClient(
      props.server.batchGraphQLURL,
      props.initialSession.csrfToken
    );
    this.state = {
      session: props.initialSession
    };
    this.pageBodyRef = React.createRef();
  }

  @autobind
  fetch(query: string, variables?: any): Promise<any> {
    return this.gqlClient.fetch(query, variables).catch(e => {
      this.handleFetchError(e);
      throw e;
    });
  }

  @autobind
  handleFetchError(e: Error) {
    window.alert(`Unfortunately, a network error occurred. Please try again later.`);
    // We're going to track exceptions in GA because we want to know how frequently
    // folks are experiencing them. However, we won't report the errors
    // to a service like Rollbar because these errors are only worth investigating
    // if they're server-side, and we've already got error reporting configured
    // over there.
    ga('send', 'exception', {
      exDescription: e.message,
      exFatal: false
    });
    console.error(e);
  }

  @autobind
  handleSessionChange(updates: Partial<AllSessionInfo>) {
    this.setState(state => ({ session: { ...state.session, ...updates } }));
  }

  handleFocusDuringPathnameChange(prevPathname: string, pathname: string) {
    // Modals handle focus changes themselves, so don't manage focus if
    // we're moving to or from a modal.
    if (!isModalRoute(prevPathname, pathname)) {
      // This isn't a modal, so focus on the page's body to ensure
      // focus isn't lost in the page transition.
      const body = this.pageBodyRef.current;
      if (body) {
        // We're using call() here to work around the fact that TypeScript doesn't
        // currently have the typings for this newer call signature for focus():
        // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus
        //
        // We want to prevent the browser from scrolling to the focus target
        // because we're managing scrolling ourselves.
        body.focus.call(body, { preventScroll: true });
      }
    }
  }

  handleScrollPositionDuringPathnameChange(prevPathname: string, pathname: string, action: Action) {
    // We don't need to worry about scroll position when transitioning into a modal, and
    // we only need to adjust it when the user is navigating to a new page. This means
    // we need to watch for history pushes (regular link clicks and such) as well
    // as replaces (e.g. when a link goes to '/foo' which immediately redirects to
    // '/foo/bar').
    if (!isModalRoute(pathname) && (action === "PUSH" || action === "REPLACE")) {
      smoothlyScrollToTopOfPage();
    }
  }

  handlePathnameChange(prevPathname: string, pathname: string, action: Action) {
    if (prevPathname !== pathname) {
      trackPageView(pathname);
      this.handleFocusDuringPathnameChange(prevPathname, pathname);
      this.handleScrollPositionDuringPathnameChange(prevPathname, pathname, action);
    }
  }

  componentDidUpdate(prevProps: AppPropsWithRouter, prevState: AppState) {
    if (prevState.session.csrfToken !== this.state.session.csrfToken) {
      this.gqlClient.csrfToken = this.state.session.csrfToken;
    }
    this.handlePathnameChange(prevProps.location.pathname,
                              this.props.location.pathname,
                              this.props.history.action);
  }

  getAppContext(): AppContextType {
    return {
      server: this.props.server,
      session: this.state.session,
      fetch: this.fetch,
      updateSession: this.handleSessionChange,
      legacyFormSubmission: this.props.legacyFormSubmission
    };
  }

  get isLoggedIn(): boolean {
    return !!this.state.session.phoneNumber;
  }

  renderRoutes(location: Location<any>): JSX.Element {
    return (
      <Switch location={location}>
        <Route path={Routes.home} exact>
          <LoadableIndexPage isLoggedIn={this.isLoggedIn} />
        </Route>
        <Route path={Routes.login} exact component={LoginPage} />
        <Route path={Routes.adminLogin} exact component={LoginPage} />
        <Route path={Routes.logout} exact component={LogoutPage} />
        <Route path={Routes.onboarding.prefix} component={LoadableOnboardingRoutes} />
        <Route path={Routes.loc.prefix} component={LoadableLetterOfComplaintRoutes} />
        <Route path={Routes.hp.prefix} component={LoadableHPActionRoutes} />
        <Route path={Routes.dev.prefix} component={LoadableDevRoutes} />
        <Route render={NotFound} />
      </Switch>
    );
  }

  render() {
    if (this.props.modal) {
      return <AppContext.Provider value={this.getAppContext()} children={this.props.modal} />
    }

    return (
      <ErrorBoundary debug={this.props.server.debug}>
        <HistoryBlockerManager>
          <AppContext.Provider value={this.getAppContext()}>
            <AriaAnnouncer>
                <Navbar/>
                <section className="section">
                  <div className="container" ref={this.pageBodyRef}
                      data-jf-is-noninteractive tabIndex={-1}>
                    <LoadingOverlayManager>
                      <Route render={(props) => {
                        if (routeMap.exists(props.location.pathname)) {
                          return this.renderRoutes(props.location);
                        }
                        return NotFound(props);
                      }}/>
                    </LoadingOverlayManager>
                  </div>
                </section>
            </AriaAnnouncer>
          </AppContext.Provider>
        </HistoryBlockerManager>
      </ErrorBoundary>
    );
  }
}

export const App = withRouter(AppWithoutRouter);

export function startApp(container: Element, initialProps: AppProps) {
  const el = (
    <BrowserRouter getUserConfirmation={getNavigationConfirmation}>
      <App {...initialProps}/>
    </BrowserRouter>
  );
  if (container.children.length) {
    // Initial content has been generated server-side, so preload any
    // necessary JS bundles and bind to the DOM.
    Loadable.preloadReady().then(() => {
      ReactDOM.hydrate(el, container);
    }).catch(e => {
      window.alert("Loadable.preloadReady() failed!");
    });
  } else {
    // No initial content was provided, so generate a DOM from scratch.
    ReactDOM.render(el, container);
  }
}
