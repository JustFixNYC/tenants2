import React from 'react';


interface LoginFormProps {
  onSubmit: (phoneNumber: string, password: string) => void;
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
    return (
      <form onSubmit={(event) => {
        event.preventDefault();
        this.props.onSubmit(this.state.phoneNumber, this.state.password);
      }}>
        <p><input className="input" type="text" placeholder="phone number" value={this.state.phoneNumber}
         onChange={(e) => { this.setState({ phoneNumber: e.target.value }); }}/></p>
        <p><input className="input" type="password" placeholder="password" value={this.state.password}
         onChange={(e) => { this.setState({ password: e.target.value }); }}/></p>
        <p><button type="submit" className="button is-primary">Submit</button></p>
      </form>
    );
  }
}
