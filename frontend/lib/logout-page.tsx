import React from 'react';

import Page from './page';
import { Link } from 'react-router-dom';

export interface LogoutPageProps {
  logoutLoading: boolean;
  onLogout: () => void;
}

interface LogoutPageState {
  hasMounted: boolean;
}

export default class LogoutPage extends React.Component<LogoutPageProps, LogoutPageState> {
  constructor(props: LogoutPageProps) {
    super(props);
    this.state = { hasMounted: false };
  }

  componentDidMount() {
    this.setState({ hasMounted: true });
    this.props.onLogout();
  }

  render() {
    let msg = <p>Signing you out...</p>;

    if (this.state.hasMounted && !this.props.logoutLoading) {
      msg = (
        <React.Fragment>
          <p>You are now signed out.</p>
          <p><Link to="/login">Sign back in</Link></p>
        </React.Fragment>
      );
    }

    return (
      <Page title="Log out">
        {msg}
      </Page>
    );
  }
}
