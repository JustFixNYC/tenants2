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
import { NotFound } from './not-found';
import Page from './page';


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

  loginErrors?: FormErrors<LoginInput>;

  loginLoading: boolean;

  logoutLoading: boolean;
}

const LoadableIndexPage = Loadable({
  loader: () => import(/* webpackChunkName: "index-page" */ './index-page'),
  loading() {
    return <div>Loading...</div>;
  }
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
      loginLoading: false,
      logoutLoading: false
    };
  }

  @autobind
  handleFetchError(e: Error) {
    console.error(e);
    window.alert(`Alas, a fatal error occurred: ${e.message}`);
  }

  @autobind
  handleLogout() {
    this.setState({ logoutLoading: true });
    fetchLogoutMutation(this.gqlClient.fetch).then((result) => {
      this.setState({
        logoutLoading: false,
        session: result.logout.session
      });
    }).catch(this.handleFetchError);
  }

  @autobind
  handleLoginSubmit({ phoneNumber, password }: LoginInput) {
    this.setState({
      loginLoading: true,
      loginErrors: undefined
    });
    fetchLoginMutation(this.gqlClient.fetch, { input: {
      phoneNumber: phoneNumber,
      password: password
    }}).then(result => {
      if (result.login.session) {
        this.setState({
          loginLoading: false,
          session: result.login.session
        });
      } else {
        this.setState({
          loginLoading: false,
          loginErrors: getFormErrors<LoginInput>(result.login.errors)
        });
      }
    }).catch(this.handleFetchError);
  }

  componentDidUpdate(prevProps: AppProps, prevState: AppState) {
    if (prevProps !== this.props) {
      throw new Error('Assertion failure, props are not expected to change');
    }
    if (prevState.session.csrfToken !== this.state.session.csrfToken) {
      this.gqlClient.csrfToken = this.state.session.csrfToken;
    }
  }

  render() {
    const appContext: AppContextType = {
      server: this.props.server,
      session: this.state.session
    };

    return (
      <AppContext.Provider value={appContext}>
        <Switch>
          <Route path="/" exact>
            <LoadableIndexPage
            loginErrors={this.state.loginErrors}
            loginLoading={this.state.loginLoading}
            logoutLoading={this.state.logoutLoading}
            onLogout={this.handleLogout}
            onLoginSubmit={this.handleLoginSubmit}
            />
          </Route>
          <Route path="/about" exact>
            <Page title="about">
              <p>This is another page.</p>
            </Page>
          </Route>
          <Route render={NotFound} />
        </Switch>
      </AppContext.Provider>
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
