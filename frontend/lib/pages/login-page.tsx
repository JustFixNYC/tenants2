import React from 'react';

import { LoginForm } from '../login-form';
import Page from '../page';
import Routes from '../routes';

export interface LoginPageProps {}

export default class LoginPage extends React.Component<LoginPageProps> {
  render() {
    return (
      <Page title="Sign in">
        <h1 className="title">Sign in</h1>
        <LoginForm onSuccessRedirect={Routes.home} />
      </Page>
    );
  }
}
