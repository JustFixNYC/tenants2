import React from 'react';

import { LoginInput } from '../queries/globalTypes';
import { LoginForm } from '../login-form';
import { FormErrors } from '../forms';
import Page from '../page';
import { Redirect } from 'react-router';
import Routes from '../routes';

export interface LoginPageProps {
  loginErrors?: FormErrors<LoginInput>;
  loginLoading: boolean;
  onLoginSubmit: (input: LoginInput) => void;
}

interface LoginPageState {
  loginSuccessful: boolean;
}

export default class LoginPage extends React.Component<LoginPageProps, LoginPageState> {
  constructor(props: LoginPageProps) {
    super(props);
    this.state = { loginSuccessful: false };
  }

  componentDidUpdate(prevProps: LoginPageProps) {
    if (prevProps.loginLoading && !this.props.loginLoading && !this.props.loginErrors) {
      // Login was successful!
      this.setState({ loginSuccessful: true });
    }
  }

  render() {
    const { props } = this;

    if (this.state.loginSuccessful) {
      return <Redirect to={Routes.home} />;
    }

    return (
      <Page title="Sign in">
        <h1 className="title">Sign in</h1>
        <LoginForm errors={props.loginErrors} isLoading={props.loginLoading} onSubmit={props.onLoginSubmit} />
      </Page>
    );
  }
}
