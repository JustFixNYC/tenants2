import React from 'react';


interface LoginFormProps {
  onSubmit: (username: string, password: string) => void;
}

interface LoginFormState {
  username: string;
  password: string;
}

export class LoginForm extends React.Component<LoginFormProps, LoginFormState> {
  constructor(props: LoginFormProps) {
    super(props);
    this.state = { username: '', password: '' };
  }

  render() {
    return (
      <form onSubmit={(event) => {
        event.preventDefault();
        this.props.onSubmit(this.state.username, this.state.password);
      }}>
        <p><input className="input" type="text" placeholder="username" value={this.state.username}
         onChange={(e) => { this.setState({ username: e.target.value }); }}/></p>
        <p><input className="input" type="password" placeholder="password" value={this.state.password}
         onChange={(e) => { this.setState({ password: e.target.value }); }}/></p>
        <p><button type="submit" className="button is-primary">Submit</button></p>
      </form>
    );
  }
}
