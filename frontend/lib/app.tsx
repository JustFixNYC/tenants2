import React from 'react';
import ReactDOM from 'react-dom';

import { setCsrfToken, setBatchGraphQLURL } from './fetch-graphql';
import { fetchSimpleQuery } from './queries/SimpleQuery';
import { fetchLogoutMutation } from './queries/LogoutMutation';
import { fetchLoginMutation } from './queries/LoginMutation';
import { LoginForm } from './login-form';
import { createAppStore, AppState, AppStore } from './redux-store';

export interface AppProps {
  staticURL: string;
  adminIndexURL: string;
  batchGraphQLURL: string;
  loadingMessage: string;
  csrfToken: string;
  username: string|null;
  debug: boolean;
}

export class App extends React.Component<AppProps, AppState> {
  store: AppStore;

  constructor(props: AppProps) {
    super(props);
    this.store = createAppStore();
    this.store.dispatch({ type: 'set-user', username: this.props.username });
    this.state = this.store.getState();
    this.store.subscribe(() => {
      this.setState(this.store.getState());
    });
  }

  componentDidMount() {
    setCsrfToken(this.props.csrfToken);
    setBatchGraphQLURL(this.props.batchGraphQLURL);
    this.store.dispatch({ type: 'fetch-simple-query', thing: (new Date()).toString() });
  }

  render() {
    const { props, state } = this;

    const handleError = (e: Error) => {
      console.error(e);
      window.alert(`Alas, a fatal error occurred: ${e.message}`);
    };

    let handleLogout = () => {
      fetchLogoutMutation().then((result) => {
        if (result.logout.ok) {
          setCsrfToken(result.logout.csrfToken);
          this.setState({ username: null });
          return;
        }
        throw new Error('Assertion failure, logout should always be ok');
      }).catch(handleError);
    };
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
          <p><button className="button is-primary" onClick={handleLogout}>Logout</button></p>
        </React.Fragment>
      );
    } else {
      const handleLoginSubmit = (username: string, password: string) => {
        fetchLoginMutation({ username: username, password: password }).then(result => {
          if (result.login.ok) {
            setCsrfToken(result.login.csrfToken);
            this.setState({ username });
          } else {
            window.alert("Invalid username or password.");
          }
        }).catch(handleError);
      };
      loginInfo = (
        <React.Fragment>
          <p>You are currently logged out.</p>
          <LoginForm onSubmit={handleLoginSubmit} />
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
            {state.simpleQuery && state.simpleQuery.state === 'ok'
             ? <p>GraphQL says <strong>{state.simpleQuery.result}</strong>.</p>
             : null}
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
