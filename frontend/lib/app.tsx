import React from 'react';
import ReactDOM from 'react-dom';
import autobind from 'autobind-decorator';
import { BrowserRouter, Switch, Route } from 'react-router-dom';

import GraphQlClient from './graphql-client';

import { fetchLogoutMutation } from './queries/LogoutMutation';
import { fetchLoginMutation } from './queries/LoginMutation';
import { IndexPage } from './index-page';
import { AppSessionInfo } from './app-session-info';
import { AppServerInfo } from './app-server-info';


export interface AppProps {
  /** The initial URL to render on page load. */
  initialURL: string;

  /** The initial session state the App was started with. */
  initialSession: AppSessionInfo;

  /** Metadata about the server. */
  server: AppServerInfo;
}

interface AppState {
  /**
   * The current request that the App is serving, which can
   * be different from the initial request if e.g. the user
   * has logged out since the initial page load.
   */
  session: AppSessionInfo;
}

export class App extends React.Component<AppProps, AppState> {
  gqlClient: GraphQlClient;

  constructor(props: AppProps) {
    super(props);
    this.gqlClient = new GraphQlClient(
      props.server.batchGraphQLURL,
      props.initialSession.csrfToken
    );
    this.state = { session: props.initialSession };
  }

  @autobind
  handleFetchError(e: Error) {
    console.error(e);
    window.alert(`Alas, a fatal error occurred: ${e.message}`);
  }

  @autobind
  handleLogout() {
    fetchLogoutMutation(this.gqlClient.fetch).then((result) => {
      if (result.logout.ok) {
        this.setState(state => ({
          session: {
            ...state.session,
            username: null,
            csrfToken: result.logout.csrfToken
          },
        }));
        return;
      }
      throw new Error('Assertion failure, logout should always be ok');
    }).catch(this.handleFetchError);
  }

  @autobind
  handleLoginSubmit(username: string, password: string) {
    fetchLoginMutation(this.gqlClient.fetch, {
      username: username,
      password: password
    }).then(result => {
      if (result.login.ok) {
        this.setState(state => ({
          session: {
            ...state.session,
            username,
            csrfToken: result.login.csrfToken
          }
        }));
      } else {
        window.alert("Invalid username or password.");
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
    return (
      <Switch>
        <Route path="/" exact>
          <IndexPage
           gqlClient={this.gqlClient}
           server={this.props.server}
           request={this.state.session}
           onFetchError={this.handleFetchError}
           onLogout={this.handleLogout}
           onLoginSubmit={this.handleLoginSubmit}
          />
        </Route>
        <Route path="/about" exact>
          <p>This is another page.</p>
        </Route>
        <Route>
          <p>Sorry, the page you are looking for doesn't seem to exist.</p>
        </Route>
      </Switch>
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
    // Initial content has been generated server-side, so bind to it.
    ReactDOM.hydrate(el, container);
  } else {
    // No initial content was provided, so generate a DOM from scratch.
    ReactDOM.render(el, container);
  }
}
