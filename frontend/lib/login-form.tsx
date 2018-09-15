import React from 'react';
import { LoginInput } from './queries/globalTypes';

import { SessionUpdatingFormSubmitter } from './forms';
import { LoginMutation } from './queries/LoginMutation';
import { TextualFormField } from './form-fields';
import { NextButton } from './buttons';

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
