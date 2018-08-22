import React from 'react';
import { Link } from 'react-router-dom';
import classnames from 'classnames';

import { LoginInput } from './queries/globalTypes';
import { LoginForm } from './login-form';
import { AppServerInfo } from './app-server-info';
import { AllSessionInfo } from './queries/AllSessionInfo';
import { FormErrors } from './forms';
import Page from './page';

export interface IndexPageProps {
  server: AppServerInfo;
  session: AllSessionInfo;
  loginErrors?: FormErrors<LoginInput>;
  loginLoading: boolean;
  logoutLoading: boolean;
  onLogout: () => void;
  onLoginSubmit: (input: LoginInput) => void;
}

interface IndexPageState {
}

export default class IndexPage extends React.Component<IndexPageProps, IndexPageState> {
  constructor(props: IndexPageProps) {
    super(props);
    this.state = {};
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
    const { server } = this.props;

    return (
      <Page server={server} title="JustFix.nyc - Technology for Housing Justice">
        <h1 className="title">Ahoy, { server.debug ? "developer" : "human" }! </h1>
        {this.renderLoginInfo()}
        <div className="content">
          <br/>
          <p>Go to <Link to="/about">another page</Link>.</p>
        </div>
      </Page>
    );
  }
}
