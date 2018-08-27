import React from 'react';
import { LoginInput } from './queries/globalTypes';

import { NonFieldErrors, TextualFormField, Form, BaseFormProps } from './forms';
import { bulmaClasses } from './bulma';

export class LoginForm extends React.Component<BaseFormProps<LoginInput>> {
  render() {
    return (
      <Form {...this.props} initialState={{ phoneNumber: '', password: '' }}>
        {(ctx) => (
          <React.Fragment>
            <NonFieldErrors errors={ctx.errors} />
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
      </Form>
    );
  }
}
