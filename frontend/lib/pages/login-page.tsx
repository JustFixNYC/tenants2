import React from 'react';

import { LoginInput } from '../queries/globalTypes';
import { LoginForm } from '../login-form';
import { FormErrors } from '../forms';
import Page from '../page';
import { Redirect } from 'react-router';
import Routes from '../routes';
import { GraphQLFetch } from '../graphql-client';
import { AllSessionInfo } from '../queries/AllSessionInfo';
import autobind from 'autobind-decorator';

export interface LoginPageProps {
  fetch: GraphQLFetch;
  onSuccess: (session: AllSessionInfo) => void;
}

interface LoginPageState {
  loginSuccessful: boolean;
}

export default class LoginPage extends React.Component<LoginPageProps, LoginPageState> {
  constructor(props: LoginPageProps) {
    super(props);
    this.state = { loginSuccessful: false };
  }

  @autobind
  handleSuccess(session: AllSessionInfo) {
    this.setState({ loginSuccessful: true });
    this.props.onSuccess(session);
  }

  render() {
    if (this.state.loginSuccessful) {
      return <Redirect to={Routes.home} />;
    }

    return (
      <Page title="Sign in">
        <h1 className="title">Sign in</h1>
        <LoginForm fetch={this.props.fetch} onSuccess={this.handleSuccess} />
      </Page>
    );
  }
}
