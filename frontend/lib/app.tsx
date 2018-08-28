import React, { RefObject } from 'react';
import ReactDOM from 'react-dom';
import autobind from 'autobind-decorator';
import { BrowserRouter, Switch, Route, Redirect, RouteComponentProps, withRouter } from 'react-router-dom';
import Loadable from 'react-loadable';

import GraphQlClient from './graphql-client';

import { getFormErrors, FormErrors } from './forms';
import { fetchLogoutMutation } from './queries/LogoutMutation';
import { fetchLoginMutation } from './queries/LoginMutation';
import { LoginInput } from './queries/globalTypes';
import { AllSessionInfo } from './queries/AllSessionInfo';
import { AppServerInfo, AppContext, AppContextType } from './app-context';
import { NotFound } from './pages/not-found';
import Page, { LoadingPage } from './page';
import { ErrorBoundary } from './error-boundary';
import LoginPage from './pages/login-page';
import LogoutPage from './pages/logout-page';
import Routes from './routes';
import OnboardingStep1 from './pages/onboarding-step-1';
import { RedirectToLatestOnboardingStep } from './onboarding';
import Navbar from './navbar';
import { AriaAnnouncer, AriaAnnouncement } from './aria';


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

  /**
   * An announcement to vocalize to screen reader users, to provide
   * context for what's going on.
   */
  ariaAnnouncement: string;
}

const LoadableIndexPage = Loadable({
  loader: () => import(/* webpackChunkName: "index-page" */ './pages/index-page'),
  loading: LoadingPage
});

const LoadableExamplePage = Loadable({
  loader: () => import(/* webpackChunkName: "example-loadable-page" */ './pages/example-loadable-page'),
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
      logoutLoading: false,
      ariaAnnouncement: ''
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
        session: result.logout.session
      });
    }).catch(e => {
      this.setState({ logoutLoading: false });
    });
  }

  @autobind
  handleSessionChange(session: AllSessionInfo) {
    this.setState({ session });
  }

  componentDidUpdate(prevProps: AppPropsWithRouter, prevState: AppState) {
    if (prevState.session.csrfToken !== this.state.session.csrfToken) {
      this.gqlClient.csrfToken = this.state.session.csrfToken;
    }
    if (prevProps.location.pathname !== this.props.location.pathname) {
      const body = this.pageBodyRef.current;
      if (body) {
        body.focus();
        const h1 = body.querySelector('h1');
        if (h1 && h1.textContent) {
          this.setState({ ariaAnnouncement: h1.textContent });
        }
      }
    }
  }

  getAppContext(): AppContextType {
    return {
      server: this.props.server,
      session: this.state.session
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
        <Route path={Routes.onboarding.latestStep} exact>
          <RedirectToLatestOnboardingStep session={this.state.session} />
        </Route>
        <Route path={Routes.onboarding.step1} exact>
          <OnboardingStep1
            fetch={this.fetch}
            onSuccess={this.handleSessionChange}
            initialState={this.state.session.onboardingStep1}
          />
        </Route>
        <Route path={Routes.onboarding.step2} exact>
          <Page title="Oops">Sorry, this page hasn't been built yet.</Page>
        </Route>
        <Route path="/__loadable-example-page" exact component={LoadableExamplePage} />
        <Route render={NotFound} />
      </Switch>
    );
  }

  render() {
    return (
      <ErrorBoundary debug={this.props.server.debug}>
        <AppContext.Provider value={this.getAppContext()}>
          <AriaAnnouncer>
            <AriaAnnouncement text={this.state.ariaAnnouncement} />
            <section className="hero is-fullheight">
              <div className="hero-head">
                <Navbar/>
              </div>
              <div className="hero-body">
                <div className="container box has-background-white" ref={this.pageBodyRef}
                    data-jf-is-noninteractive tabIndex={-1}>
                {this.renderRoutes()}
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
