import React from 'react';

import { LoginForm } from '../login-form';
import Page from '../page';
import Routes from '../routes';
import { GraphQLFetch } from '../graphql-client';
import { AllSessionInfo } from '../queries/AllSessionInfo';

export interface LoginPageProps {
  fetch: GraphQLFetch;
  onSuccess: (session: AllSessionInfo) => void;
}

export default class LoginPage extends React.Component<LoginPageProps> {
  render() {
    return (
      <Page title="Sign in">
        <h1 className="title">Sign in</h1>
        <LoginForm fetch={this.props.fetch} onSuccess={this.props.onSuccess} onSuccessRedirect={Routes.home} />
      </Page>
    );
  }
}
