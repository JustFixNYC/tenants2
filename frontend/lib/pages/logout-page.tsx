import React from 'react';

import Page from '../page';
import { Link } from 'react-router-dom';
import { AppContext } from '../app-context';
import { bulmaClasses } from '../bulma';
import Routes from '../routes';

export interface LogoutPageProps {
  logoutLoading: boolean;
  onLogout: () => void;
}

export default class LogoutPage extends React.Component<LogoutPageProps> {
  render() {
    return (
      <AppContext.Consumer>
        {(appContext) => {
          if (appContext.session.phoneNumber) {
            return (
              <Page title="Sign out">
                <h1 className="title">Are you sure you want to sign out?</h1>
                <button type="submit" className={bulmaClasses('button', 'is-primary', {
                  'is-loading': this.props.logoutLoading
                })} onClick={this.props.onLogout}>Yes, sign out</button>
              </Page>
            );
          } else {
            return (
              <Page title="Signed out">
                <h1 className="title">You are now signed out.</h1>
                <p><Link to={Routes.login}>Sign back in</Link></p>
              </Page>
            );
          }
        }}
      </AppContext.Consumer>
    );
  }
}
