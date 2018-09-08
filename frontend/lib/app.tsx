import React, { RefObject } from 'react';
import ReactDOM from 'react-dom';
import autobind from 'autobind-decorator';
import { BrowserRouter, Switch, Route, RouteComponentProps, withRouter, Redirect } from 'react-router-dom';
import Loadable from 'react-loadable';

import GraphQlClient from './graphql-client';

import { fetchLogoutMutation } from './queries/LogoutMutation';
import { AllSessionInfo } from './queries/AllSessionInfo';
import { AppServerInfo, AppContext, AppContextType } from './app-context';
import { NotFound } from './pages/not-found';
import { LoadingPage } from './page';
import { ErrorBoundary } from './error-boundary';
import LoginPage from './pages/login-page';
import LogoutPage from './pages/logout-page';
import Routes, { isModalRoute, routeMap } from './routes';
import Navbar from './navbar';
import { AriaAnnouncer } from './aria';


export interface AppProps {
  /** The initial URL to render on page load. */
  initialURL: string;

  /** The initial session state the App was started with. */
  initialSession: AllSessionInfo;

  /** Metadata about the server. */
  server: AppServerInfo;
}

export type AppPropsWithRouter = AppProps & RouteComponentProps<any>;

interface AppState {
  /**
   * The current session state of the App, which can
   * be different from the initial session if e.g. the user
   * has logged out since the initial page load.
   */
  session: AllSessionInfo;

  /** Whether the user is currently logging out. */
  logoutLoading: boolean;
}

const LoadableIndexPage = Loadable({
  loader: () => import(/* webpackChunkName: "index-page" */ './pages/index-page'),
  loading: LoadingPage
});

const LoadableExamplePage = Loadable({
  loader: () => import(/* webpackChunkName: "example-loadable-page" */ './pages/example-loadable-page'),
  loading: LoadingPage
});

const LoadableExampleModalPage = Loadable({
  loader: () => import(/* webpackChunkName: "example-modal-page" */ './pages/example-modal-page'),
  loading: LoadingPage
});

const LoadableOnboardingRoutes = Loadable({
  loader: () => import(/* webpackChunkName: "onboarding" */ './onboarding'),
  loading: LoadingPage
});

const LoadableLetterOfComplaintRoutes = Loadable({
  loader: () => import(/* webpackChunkName: "letter-of-complaint" */ './letter-of-complaint'),
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
      session: props.initialSession,
      logoutLoading: false
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
    console.error(e);
  }

  @autobind
  handleLogout() {
    this.setState({ logoutLoading: true });
    return fetchLogoutMutation(this.fetch).then((result) => {
      this.setState({
        logoutLoading: false,
        session: result.output.session
      });
    }).catch(e => {
      this.setState({ logoutLoading: false });
    });
  }

  @autobind
  handleSessionChange(updates: Partial<AllSessionInfo>) {
    this.setState(state => ({ session: { ...state.session, ...updates } }));
  }

  componentDidUpdate(prevProps: AppPropsWithRouter, prevState: AppState) {
    if (prevState.session.csrfToken !== this.state.session.csrfToken) {
      this.gqlClient.csrfToken = this.state.session.csrfToken;
    }
    const prevPathname = prevProps.location.pathname;
    const pathname = this.props.location.pathname;
    if (prevPathname !== pathname && !isModalRoute(prevPathname, pathname)) {
      const body = this.pageBodyRef.current;
      if (body) {
        body.focus();
      }
    }
  }

  getAppContext(): AppContextType {
    return {
      server: this.props.server,
      session: this.state.session,
      fetch: this.fetch,
      updateSession: this.handleSessionChange
    };
  }

  get isLoggedIn(): boolean {
    return !!this.state.session.phoneNumber;
  }

  renderRoutes(): JSX.Element {
    return (
      <Switch>
        <Route path={Routes.home} exact>
          <LoadableIndexPage isLoggedIn={this.isLoggedIn} />
        </Route>
        <Route path={Routes.login} exact>
          <LoginPage
            fetch={this.fetch}
            onSuccess={this.handleSessionChange}
          />
        </Route>
        <Route path={Routes.logout} exact>
          <LogoutPage
            isLoggedIn={this.isLoggedIn}
            logoutLoading={this.state.logoutLoading}
            onLogout={this.handleLogout}
          />
        </Route>
        <Route path={Routes.onboarding.prefix} render={() => (
          <LoadableOnboardingRoutes
            session={this.state.session}
            fetch={this.fetch}
            onCancelOnboarding={
              // If onboarding is explicitly cancelled, we want to flush the
              // user's session to preserve their privacy, so that any
              // sensitive data they've entered is removed from their browser.
              // Since it's assumed they're not logged in anyways, we can do
              // this by "logging out", which also clears all session data.
              this.handleLogout
            }
            onSessionChange={this.handleSessionChange}
          />
        )} />
        <Route path={Routes.loc.prefix} component={LoadableLetterOfComplaintRoutes} />
        <Route path={Routes.examples.redirect} exact render={() => <Redirect to="/" />} />
        <Route path={Routes.examples.modal} exact component={LoadableExampleModalPage} />>
        <Route path={Routes.examples.loadable} exact component={LoadableExamplePage} />
        <Route render={NotFound} />
      </Switch>
    );
  }

  render() {
    return (
      <ErrorBoundary debug={this.props.server.debug}>
        <AppContext.Provider value={this.getAppContext()}>
          <AriaAnnouncer>
            <section className="hero is-fullheight">
              <div className="hero-head">
                <Navbar/>
              </div>
              <div className="hero-body">
                <div className="container box has-background-white" ref={this.pageBodyRef}
                     data-jf-is-noninteractive tabIndex={-1}>
                <Route path="/" render={(props) => {
                  if (routeMap.exists(props.location.pathname)) {
                    return this.renderRoutes();
                  }
                  return NotFound(props);
                }} />
                </div>
              </div>
              <div className="hero-foot"></div>
            </section>
          </AriaAnnouncer>
        </AppContext.Provider>
      </ErrorBoundary>
    );
  }
}

export const App = withRouter(AppWithoutRouter);

export function startApp(container: Element, initialProps: AppProps) {
  const el = (
    <BrowserRouter>
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
