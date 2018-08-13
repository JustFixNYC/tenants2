import React from 'react';
import ReactDOM from 'react-dom';

import GraphQlClient from './graphql-client';
import { fetchSimpleQuery } from './queries/SimpleQuery';
import { fetchLogoutMutation } from './queries/LogoutMutation';
import { fetchLoginMutation } from './queries/LoginMutation';
import { LoginForm } from './login-form';
import { autobind } from './util';

export interface AppProps {
  staticURL: string;
  adminIndexURL: string;
  batchGraphQLURL: string;
  loadingMessage: string;
  csrfToken: string;
  username: string|null;
  debug: boolean;
}

interface AppState {
  simpleQueryResult?: string;
  username: string|null;
}

export class App extends React.Component<AppProps, AppState> {
  gqlClient: GraphQlClient;

  constructor(props: AppProps) {
    super(props);
    this.gqlClient = new GraphQlClient(this.props.batchGraphQLURL, this.props.csrfToken);
    this.state = {
      username: props.username
    };
    autobind(this, 'handleFetchError', 'handleLogout', 'handleLoginSubmit');
  }

  componentDidMount() {
    fetchSimpleQuery(this.gqlClient.fetch, { thing: (new Date()).toString() }).then(result => {
      this.setState({ simpleQueryResult: result.hello });
    }).catch(this.handleFetchError);
  }

  handleFetchError(e: Error) {
    console.error(e);
    window.alert(`Alas, a fatal error occurred: ${e.message}`);
  }

  handleLogout() {
    fetchLogoutMutation(this.gqlClient.fetch).then((result) => {
      if (result.logout.ok) {
        this.gqlClient.csrfToken = result.logout.csrfToken;
        this.setState({ username: null });
        return;
      }
      throw new Error('Assertion failure, logout should always be ok');
    }).catch(this.handleFetchError);
  }

  handleLoginSubmit(username: string, password: string) {
    fetchLoginMutation(this.gqlClient.fetch, {
      username: username,
      password: password
    }).then(result => {
      if (result.login.ok) {
        this.gqlClient.csrfToken = result.login.csrfToken;
        this.setState({ username });
      } else {
        window.alert("Invalid username or password.");
      }
    }).catch(this.handleFetchError);
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
