import React from 'react';

import Page from '../page';
import Routes from '../routes';
import { SessionUpdatingFormSubmitter } from '../forms';
import { LoginMutation } from '../queries/LoginMutation';
import { TextualFormField } from '../form-fields';
import { NextButton } from '../buttons';
import { LoginInput } from '../queries/globalTypes';

const initialState: LoginInput = {
  phoneNumber: '',
  password: ''
};

export interface LoginFormProps {
  onSuccessRedirect: string;
}

export class LoginForm extends React.Component<LoginFormProps> {
  render() {
    return (
      <SessionUpdatingFormSubmitter
        mutation={LoginMutation}
        initialState={initialState}
        onSuccessRedirect={this.props.onSuccessRedirect}
      >
        {(ctx) => (
          <React.Fragment>
            <TextualFormField label="Phone number" {...ctx.fieldPropsFor('phoneNumber')} />
            <TextualFormField label="Password" type="password" {...ctx.fieldPropsFor('password')} />
            <div className="field">
              <NextButton isLoading={ctx.isLoading} label="Sign in" />
            </div>
          </React.Fragment>
        )}
      </SessionUpdatingFormSubmitter>
    );
  }
}

export interface LoginPageProps {}

export default function LoginPage(): JSX.Element {
  return (
    <Page title="Sign in">
      <h1 className="title">Sign in</h1>
      <LoginForm onSuccessRedirect={Routes.home} />
    </Page>
  );
}
