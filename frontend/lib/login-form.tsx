import React from 'react';
import { LoginInput } from './queries/globalTypes';

import { FormErrors, NonFieldErrors, BaseFormFieldProps, TextualFormField } from './forms';
import autobind from 'autobind-decorator';
import { bulmaClasses } from './bulma';

interface LoginFormProps {
  onSubmit: (input: LoginInput) => void;
  isLoading: boolean;
  errors?: FormErrors<LoginInput>;
}

type LoginFormState = LoginInput;

export class LoginForm extends React.Component<LoginFormProps, LoginFormState> {
  constructor(props: LoginFormProps) {
    super(props);
    this.state = { phoneNumber: '', password: '' };
  }

  @autobind
  handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!this.props.isLoading) {
      this.props.onSubmit(this.state);
    }
  }

  fieldPropsFor<K extends keyof LoginFormState>(field: K): BaseFormFieldProps<LoginFormState[K]>  {
    return {
      onChange: (value) => {
        // We really shouldn't have to provide a full state here,
        // but TypeScript complains if we attempt to provide a
        // partial one. :(
        this.setState(state => ({ ...state, [field]: value }));
      },
      errors: this.props.errors && this.props.errors.fieldErrors[field],
      value: this.state[field],
      name: field,
      isDisabled: this.props.isLoading
    };
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <NonFieldErrors errors={this.props.errors} />
        <TextualFormField label="Phone number" {...this.fieldPropsFor('phoneNumber')} />
        <TextualFormField label="Password" type="password" {...this.fieldPropsFor('password')} />
        <div className="field">
          <div className="control">
            <button type="submit" className={bulmaClasses('button', 'is-primary', {
              'is-loading': this.props.isLoading
            })}>Sign in</button>
          </div>
        </div>
      </form>
    );
  }
}
