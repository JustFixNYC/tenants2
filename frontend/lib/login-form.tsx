import React from 'react';
import { LoginInput } from './queries/globalTypes';

import { TextualFormField, FormSubmitter } from './forms';
import { bulmaClasses } from './bulma';
import { GraphQLFetch } from './graphql-client';
import { AllSessionInfo } from './queries/AllSessionInfo';
import autobind from 'autobind-decorator';
import { fetchLoginMutation } from './queries/LoginMutation';
import { assertNotNull } from './util';
import { LocationDescriptor } from 'history';

const initialState: LoginInput = {
  phoneNumber: '',
  password: ''
};

export interface LoginFormProps {
  fetch: GraphQLFetch;
  onSuccess: (session: AllSessionInfo) => void;
  onSuccessRedirect?: LocationDescriptor;
}

export class LoginForm extends React.Component<LoginFormProps> {
  @autobind
  handleSubmit(input: LoginInput) {
    return fetchLoginMutation(this.props.fetch, { input }).then(result => result.login);
  }

  render() {
    return (
      <FormSubmitter onSubmit={this.handleSubmit}
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
