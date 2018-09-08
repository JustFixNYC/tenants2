import React from 'react';
import { LoginInput } from './queries/globalTypes';

import { FormSubmitter } from './forms';
import { bulmaClasses } from './bulma';
import { GraphQLFetch } from './graphql-client';
import { AllSessionInfo } from './queries/AllSessionInfo';
import { fetchLoginMutation } from './queries/LoginMutation';
import { assertNotNull } from './util';
import { TextualFormField } from './form-fields';
import { createMutationSubmitHandler } from './forms-graphql';

const initialState: LoginInput = {
  phoneNumber: '',
  password: ''
};

export interface LoginFormProps {
  fetch: GraphQLFetch;
  onSuccess: (session: AllSessionInfo) => void;
  onSuccessRedirect?: string;
}

export class LoginForm extends React.Component<LoginFormProps> {
  render() {
    return (
      <FormSubmitter onSubmit={createMutationSubmitHandler(this.props.fetch, fetchLoginMutation)}
                     initialState={initialState}
                     onSuccessRedirect={this.props.onSuccessRedirect}
                     onSuccess={(output) => this.props.onSuccess(assertNotNull(output.session)) } >
        {(ctx) => (
          <React.Fragment>
            <TextualFormField label="Phone number" {...ctx.fieldPropsFor('phoneNumber')} />
            <TextualFormField label="Password" type="password" {...ctx.fieldPropsFor('password')} />
            <div className="field">
              <div className="control">
                <button type="submit" className={bulmaClasses('button', 'is-primary', {
                  'is-loading': ctx.isLoading
                })}>Sign in</button>
              </div>
            </div>
          </React.Fragment>
        )}
      </FormSubmitter>
    );
  }
}
