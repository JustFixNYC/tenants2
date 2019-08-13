import React, { RefObject } from 'react';
import ReactDOM from 'react-dom';
import autobind from 'autobind-decorator';
import { BrowserRouter, Switch, Route, RouteComponentProps, withRouter } from 'react-router-dom';
import loadable, { loadableReady } from '@loadable/component';

import GraphQlClient from './graphql-client';

import { AllSessionInfo } from './queries/AllSessionInfo';
import { AppServerInfo, AppContext, AppContextType, AppLegacyFormSubmission } from './app-context';
import { NotFound } from './pages/not-found';
import { friendlyLoad, LoadingOverlayManager, LoadingPage } from "./loading-page";
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
import { OnboardingInfoSignupIntent } from './queries/globalTypes';
import { getOnboardingRouteForIntent } from './signup-intent';
import HelpPage from './pages/help-page';


export interface AppProps {
  /** The initial URL to render on page load. */
  initialURL: string;

  /**
   * The locale the user is on. This can be an empty string to
   * indicate that localization is disabled, or an ISO 639-1
   * code such as 'en' or 'es'.
   */
  locale: string;

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

const LoadableDataDrivenOnboardingRoutes = loadable(() => friendlyLoad(import('./pages/data-driven-onboarding')), {
  fallback: <LoadingPage />
});

const LoadableIndexPage = loadable(() => friendlyLoad(import('./pages/index-page')), {
  fallback: <LoadingPage />
});

const LoadablePasswordResetRoutes = loadable(() => friendlyLoad(import('./pages/password-reset')), {
  fallback: <LoadingPage />
});

const LoadableLetterOfComplaintRoutes = loadable(() => friendlyLoad(import('./letter-of-complaint')), {
  fallback: <LoadingPage />
});

const LoadableHPActionRoutes = loadable(() => friendlyLoad(import('./hp-action')), {
  fallback: <LoadingPage />
});

const LoadableDevRoutes = loadable(() => friendlyLoad(import('./dev')), {
  fallback: <LoadingPage/>
});

const LoadableDataRequestsRoutes = loadable(() => friendlyLoad(import('./pages/data-requests')), {
  fallback: <LoadingPage />
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

  handleLogin() {
    const { userId, firstName } = this.state.session;
    if (window.FS && userId !== null) {
      // FullStory ignores '1' as a user ID because it might be unintentional,
      // but that's actually a valid user ID for our purposes, so we'll munge
      // our user IDs a bit so FullStory always uses them.
      const uid = `user:${userId}`;

      window.FS.identify(uid, { displayName: `${firstName || '' } (#${userId})` });
    }
  }

  handleLogout() {
    // We're not going to bother telling FullStory that the user logged out,
    // because we don't really want it associating the current user with a
    // brand-new anonymous user (as FullStory's priced plans have strict limits
    // on the number of user sessions they can support).
  }

  componentDidMount() {
    if (this.state.session.userId !== null) {
      this.handleLogin();
    }
  }

  componentDidUpdate(prevProps: AppPropsWithRouter, prevState: AppState) {
    if (prevState.session.userId !== this.state.session.userId) {
      if (this.state.session.userId === null) {
        this.handleLogout();
      } else {
        this.handleLogin();
      }
    }
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
        <Route path={Routes.locale.home} exact>
          <LoadableIndexPage isLoggedIn={this.isLoggedIn} />
        </Route>
        <Route path={Routes.locale.help} component={HelpPage} />
        <Route path={Routes.locale.dataDrivenOnboarding} component={LoadableDataDrivenOnboardingRoutes} />
        <Route path={Routes.locale.login} exact component={LoginPage} />
        <Route path={Routes.adminLogin} exact component={LoginPage} />
        <Route path={Routes.locale.logout} exact component={LogoutPage} />
        {getOnboardingRouteForIntent(OnboardingInfoSignupIntent.LOC)}
        <Route path={Routes.locale.loc.prefix} component={LoadableLetterOfComplaintRoutes} />
        {getOnboardingRouteForIntent(OnboardingInfoSignupIntent.HP)}
        <Route path={Routes.locale.hp.prefix} component={LoadableHPActionRoutes} />
        <Route path={Routes.dev.prefix} component={LoadableDevRoutes} />
        <Route path={Routes.locale.dataRequests.prefix} component={LoadableDataRequestsRoutes} />
        <Route path={Routes.locale.passwordReset.prefix} component={LoadablePasswordResetRoutes} />
        <Route render={NotFound} />
      </Switch>
    );
  }

  renderRoute(props: RouteComponentProps<any>): JSX.Element {
    const { pathname } = props.location;
    if (routeMap.exists(pathname)) {
      return this.renderRoutes(props.location);
    }
    return NotFound(props);
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
                      <Route render={(props) => this.renderRoute(props)}/>
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
    loadableReady(() => {
      ReactDOM.hydrate(el, container);
    });
  } else {
    // No initial content was provided, so generate a DOM from scratch.
    ReactDOM.render(el, container);
  }
}
