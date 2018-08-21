import React from 'react';
import { Link } from 'react-router-dom';
import classnames from 'classnames';

import { fetchSimpleQuery } from './queries/SimpleQuery';
import { LoginInput } from './queries/globalTypes';
import { LoginForm } from './login-form';
import GraphQlClient from './graphql-client';
import { AppServerInfo } from './app-server-info';
import { AppSessionInfo } from './app-session-info';
import { FormErrors } from './forms';

export interface IndexPageProps {
  gqlClient: GraphQlClient;
  server: AppServerInfo;
  session: AppSessionInfo;
  loginErrors?: FormErrors<LoginInput>;
  loginLoading: boolean;
  logoutLoading: boolean;
  onFetchError: (e: Error) => void;
  onLogout: () => void;
  onLoginSubmit: (input: LoginInput) => void;
}

interface IndexPageState {
  simpleQueryResult?: string;
}

export default class IndexPage extends React.Component<IndexPageProps, IndexPageState> {
  constructor(props: IndexPageProps) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    fetchSimpleQuery(this.props.gqlClient.fetch, { thing: (new Date()).toString() }).then(result => {
      this.setState({ simpleQueryResult: result.hello });
    }).catch(this.props.onFetchError);
  }

  renderDebugInfo(): JSX.Element|null {
    const { server } = this.props;

    if (server.debug) {
      return (
        <React.Fragment>
          <p>
            For more details on the size of our JS bundle, see the {` `}
            <a href={`${server.staticURL}frontend/report.html`}>webpack bundle analysis report</a>.
          </p>
          <p>
            You can interactively inspect GraphQL queries with <a href="/graphiql">GraphiQL</a>.
          </p>
          <p>
            Or you can visit the <a href={server.adminIndexURL}>admin</a>, though
            you will probably want to run <code>manage.py createsuperuser</code> first.
          </p>
        </React.Fragment>
      );
    }

    return null;
  }

  renderLoginInfo(): JSX.Element {
    const { props } = this;
    const { session } = props;

    if (session.phoneNumber) {
      return (
        <React.Fragment>
          <p>You are currently logged in as {session.phoneNumber}.</p>
          <p><button className={classnames('button', 'is-primary', {
            'is-loading': props.logoutLoading
          })} onClick={props.onLogout}>Logout</button></p>
        </React.Fragment>
      );
    }
    return (
      <React.Fragment>
        <p>You are currently logged out.</p>
        <LoginForm errors={props.loginErrors} isLoading={props.loginLoading} onSubmit={props.onLoginSubmit} />
      </React.Fragment>
    );
  }

  render() {
    const { state } = this;
    const { server } = this.props;

    return (
      <section className="hero is-fullheight">
        <div className="hero-head"></div>
        <div className="hero-body">
          <div className="container content box has-background-white">
            <h1 className="title">Ahoy, { server.debug ? "developer" : "human" }! </h1>
            {this.renderLoginInfo()}
            {this.renderDebugInfo()}
            <p>Go to <Link to="/about">another page</Link>.</p>
            {state.simpleQueryResult ? <p>GraphQL says <strong>{state.simpleQueryResult}</strong>.</p> : null}
          </div>
        </div>
        <div className="hero-foot"></div>
      </section>
    );
  }
}
