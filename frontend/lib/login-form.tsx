import React from 'react';
import { LoginInput } from './queries/globalTypes';

import { FormErrors, ListFieldErrors, BaseFormFieldProps, TextualFormField } from './forms';
import autobind from 'autobind-decorator';

interface LoginFormProps {
  onSubmit: (input: LoginInput) => void;
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
    this.props.onSubmit(this.state);
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
      value: this.state[field]
    };
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <ListFieldErrors errors={this.props.errors && this.props.errors.nonFieldErrors} />
        <TextualFormField label="Phone number" {...this.fieldPropsFor('phoneNumber')} />
        <TextualFormField label="Password" type="password" {...this.fieldPropsFor('password')} />
        <p><button type="submit" className="button is-primary">Submit</button></p>
      </form>
    );
  }
}
