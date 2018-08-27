import React from 'react';
import ReactDOM from 'react-dom';
import autobind from 'autobind-decorator';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import Loadable from 'react-loadable';

import GraphQlClient from './graphql-client';

import { getFormErrors, FormErrors } from './forms';
import { fetchLogoutMutation } from './queries/LogoutMutation';
import { fetchLoginMutation } from './queries/LoginMutation';
import { LoginInput } from './queries/globalTypes';
import { AllSessionInfo } from './queries/AllSessionInfo';
import { AppServerInfo, AppContext, AppContextType } from './app-context';
import { NotFound } from './pages/not-found';
import { LoadingPage } from './page';
import { ErrorBoundary } from './error-boundary';
import LoginPage from './pages/login-page';
import LogoutPage from './pages/logout-page';
import Routes from './routes';
import OnboardingStep1 from './pages/onboarding-step-1';


export interface AppProps {
  /** The initial URL to render on page load. */
  initialURL: string;

  /** The initial session state the App was started with. */
  initialSession: AllSessionInfo;

  /** Metadata about the server. */
  server: AppServerInfo;
}

interface AppState {
  /**
   * The current session state of the App, which can
   * be different from the initial session if e.g. the user
   * has logged out since the initial page load.
   */
  session: AllSessionInfo;

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

export class App extends React.Component<AppProps, AppState> {
  gqlClient: GraphQlClient;

  constructor(props: AppProps) {
    super(props);
    this.gqlClient = new GraphQlClient(
      props.server.batchGraphQLURL,
      props.initialSession.csrfToken
    );
    this.state = {
      session: props.initialSession,
      logoutLoading: false
    };
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

  componentDidUpdate(prevProps: AppProps, prevState: AppState) {
    if (prevProps !== this.props) {
      throw new Error('Assertion failure, props are not expected to change');
    }
    if (prevState.session.csrfToken !== this.state.session.csrfToken) {
      this.gqlClient.csrfToken = this.state.session.csrfToken;
    }
  }

  getAppContext(): AppContextType {
    return {
      server: this.props.server,
      session: this.state.session
    };
  }

  render() {
    return (
      <ErrorBoundary debug={this.props.server.debug}>
        <AppContext.Provider value={this.getAppContext()}>
          <Switch>
            <Route path={Routes.home} exact>
              <LoadableIndexPage />
            </Route>
            <Route path={Routes.login} exact>
              <LoginPage
                fetch={this.fetch}
                onSuccess={this.handleSessionChange}
              />
            </Route>
            <Route path={Routes.logout} exact>
              <LogoutPage
                logoutLoading={this.state.logoutLoading}
                onLogout={this.handleLogout}
              />
            </Route>
            <Route path={Routes.onboarding.index}>
              <OnboardingStep1 fetch={this.fetch} />
            </Route>
            <Route path="/__loadable-example-page" exact component={LoadableExamplePage} />
            <Route render={NotFound} />
          </Switch>
        </AppContext.Provider>
      </ErrorBoundary>
    );
  }
}

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
