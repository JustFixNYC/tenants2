import React from 'react';
import ReactDOM from 'react-dom';
import autobind from 'autobind-decorator';

import GraphQlClient from './graphql-client';
import { fetchSimpleQuery } from './queries/SimpleQuery';
import { fetchLogoutMutation } from './queries/LogoutMutation';
import { fetchLoginMutation } from './queries/LoginMutation';
import { LoginForm } from './login-form';

export interface AppProps {
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
  simpleQueryResult?: string;
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

  componentDidMount() {
    fetchSimpleQuery(this.gqlClient.fetch, { thing: (new Date()).toString() }).then(result => {
      this.setState({ simpleQueryResult: result.hello });
    }).catch(this.handleFetchError);
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

    let debugInfo = null;

    if (props.debug) {
      debugInfo = (
        <React.Fragment>
          <p>
            For more details on the size of our JS bundle, see the {` `}
            <a href={`${props.staticURL}frontend/report.html`}>webpack bundle analysis report</a>.
          </p>
          <p>
            You can interactively inspect GraphQL queries with <a href="/graphiql">GraphiQL</a>.
          </p>
          <p>
            Or you can visit the <a href={props.adminIndexURL}>admin</a>, though
            you will probably want to run <code>manage.py createsuperuser</code> first.
          </p>
        </React.Fragment>
      );
    }

    let loginInfo;

    if (state.username) {
      loginInfo = (
        <React.Fragment>
          <p>You are currently logged in as {state.username}.</p>
          <p><button className="button is-primary" onClick={this.handleLogout}>Logout</button></p>
        </React.Fragment>
      );
    } else {
      loginInfo = (
        <React.Fragment>
          <p>You are currently logged out.</p>
          <LoginForm onSubmit={this.handleLoginSubmit} />
        </React.Fragment>
      );
    }

    return (
      <section className="hero is-fullheight">
        <div className="hero-head"></div>
        <div className="hero-body">
          <div className="container content box has-background-white">
            <h1 className="title">Ahoy, { props.debug ? "developer" : "human" }! </h1>
            {loginInfo}
            {debugInfo}
            {state.simpleQueryResult ? <p>GraphQL says <strong>{state.simpleQueryResult}</strong>.</p> : null}
          </div>
        </div>
        <div className="hero-foot"></div>
      </section>
    );
  }
}

export function startApp(container: Element, initialProps: AppProps) {
  const el = <App {...initialProps}/>;
  if (container.children.length) {
    // Initial content has been generated server-side, so bind to it.
    ReactDOM.hydrate(el, container);
  } else {
    // No initial content was provided, so generate a DOM from scratch.
    ReactDOM.render(el, container);
  }
}
