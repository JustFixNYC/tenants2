import React from 'react';
import { Link } from 'react-router-dom';

import { fetchSimpleQuery } from './queries/SimpleQuery';
import { LoginForm } from './login-form';
import GraphQlClient from './graphql-client';

export interface IndexPageProps {
  gqlClient: GraphQlClient;
  staticURL: string;
  adminIndexURL: string;
  debug: boolean;
  username: string|null;
  onFetchError: (e: Error) => void;
  onLogout: () => void;
  onLoginSubmit: (username: string, password: string) => void;
}

interface IndexPageState {
  simpleQueryResult?: string;
}

export class IndexPage extends React.Component<IndexPageProps, IndexPageState> {
  constructor(props: IndexPageProps) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    fetchSimpleQuery(this.props.gqlClient.fetch, { thing: (new Date()).toString() }).then(result => {
      this.setState({ simpleQueryResult: result.hello });
    }).catch(this.props.onFetchError);
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

    if (props.username) {
      loginInfo = (
        <React.Fragment>
          <p>You are currently logged in as {props.username}.</p>
          <p><button className="button is-primary" onClick={props.onLogout}>Logout</button></p>
        </React.Fragment>
      );
    } else {
      loginInfo = (
        <React.Fragment>
          <p>You are currently logged out.</p>
          <LoginForm onSubmit={props.onLoginSubmit} />
        </React.Fragment>
      );
    }

    return (
      <section className="hero is-fullheight">
        <div className="hero-head"></div>
        <div className="hero-body">
          <div className="container content box has-background-white">
            <h1 className="title">Ahoyy, { props.debug ? "developer" : "human" }! </h1>
            {loginInfo}
            {debugInfo}
            <p>Go to <Link to="/about">another page</Link>.</p>
            {state.simpleQueryResult ? <p>GraphQL says <strong>{state.simpleQueryResult}</strong>.</p> : null}
          </div>
        </div>
        <div className="hero-foot"></div>
      </section>
    );
  }
}
