import React from 'react';
import { LoginInput } from './queries/LoginMutation';

import { FormErrors, ListFieldErrors } from './forms';


interface LoginFormProps {
  onSubmit: (phoneNumber: string, password: string) => void;
  loginErrors?: FormErrors<LoginInput>;
}

interface LoginFormState {
  phoneNumber: string;
  password: string;
}

export class LoginForm extends React.Component<LoginFormProps, LoginFormState> {
  constructor(props: LoginFormProps) {
    super(props);
    this.state = { phoneNumber: '', password: '' };
  }

  render() {
    const errors = this.props.loginErrors;

    return (
      <form onSubmit={(event) => {
        event.preventDefault();
        this.props.onSubmit(this.state.phoneNumber, this.state.password);
      }}>
        <ListFieldErrors errors={errors && errors.nonFieldErrors} />
        <p><input className="input" type="text" placeholder="phone number" value={this.state.phoneNumber}
         onChange={(e) => { this.setState({ phoneNumber: e.target.value }); }}/></p>
        <ListFieldErrors errors={errors && errors.fieldErrors['phoneNumber']} />
        <p><input className="input" type="password" placeholder="password" value={this.state.password}
         onChange={(e) => { this.setState({ password: e.target.value }); }}/></p>
        <ListFieldErrors errors={errors && errors.fieldErrors['password']} />
        <p><button type="submit" className="button is-primary">Submit</button></p>
      </form>
    );
  }
}
