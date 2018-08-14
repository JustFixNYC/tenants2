import React from 'react';
import ReactDOM from 'react-dom';
import autobind from 'autobind-decorator';
import { BrowserRouter, Switch, Route } from 'react-router-dom';

import GraphQlClient from './graphql-client';

import { fetchLogoutMutation } from './queries/LogoutMutation';
import { fetchLoginMutation } from './queries/LoginMutation';
import { IndexPage } from './index-page';


export interface AppProps {
  /** The URL to render */
  url: string;

  /**
   * The URL of the server's static files, e.g. "/static/".
   */
  staticURL: string;

  /**
   * The URL of the server's Django admin, e.g. "/admin/".
   */
  adminIndexURL: string;

  /**
   * The username of the currently logged-in user, or null if not logged-in.
   */
  username: string|null;

  /**
   * Whether the site is in development mode (corresponds to settings.DEBUG in
   * the Django app).
   */
  debug: boolean;

  /** The GraphQL client to use for requests. */
  gqlClient?: GraphQlClient;

  /** The batch GraphQL endpoint; required if a GraphQL client is not provided. */
  batchGraphQLURL?: string;

  /** The CSRF token; required if a GraphQL client is not provided. */
  csrfToken?: string;
}

interface AppState {
  csrfToken: string;
  username: string|null;
}

export class App extends React.Component<AppProps, AppState> {
  gqlClient: GraphQlClient;

  constructor(props: AppProps) {
    super(props);
    if (props.gqlClient) {
      this.gqlClient = props.gqlClient;
    } else {
      if (!this.props.batchGraphQLURL || !this.props.csrfToken) {
        throw new Error("Assertion failure, need props to construct GraphQL client");
      }
      this.gqlClient = new GraphQlClient(this.props.batchGraphQLURL, this.props.csrfToken);
    }
    this.state = {
      username: props.username,
      csrfToken: this.gqlClient.csrfToken
    };
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
        this.setState({ username: null, csrfToken: result.logout.csrfToken });
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
        this.setState({ username, csrfToken: result.login.csrfToken });
      } else {
        window.alert("Invalid username or password.");
      }
    }).catch(this.handleFetchError);
  }

  componentDidUpdate(prevProps: AppProps, prevState: AppState) {
    if (prevProps !== this.props) {
      throw new Error('Assertion failure, props are not expected to change');
    }
    if (prevState.csrfToken !== this.state.csrfToken) {
      this.gqlClient.csrfToken = this.state.csrfToken;
    }
  }

  render() {
    const { props, state } = this;

    return (
      <Switch>
        <Route path="/" exact>
          <IndexPage
           gqlClient={this.gqlClient}
           staticURL={props.staticURL}
           adminIndexURL={props.adminIndexURL}
           debug={props.debug}
           username={state.username}
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
