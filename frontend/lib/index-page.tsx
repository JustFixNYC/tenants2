import React from 'react';

import Page from './page';
import { Link } from 'react-router-dom';
import { AppContext } from './app-context';

export interface IndexPageProps {
}

export default class IndexPage extends React.Component<IndexPageProps> {
  renderSignedOut() {
    return (
      <Page title="Technology for Housing Justice">
        <h1 className="title">Level the playing field between you and your landlord.</h1>
        <h2 className="subtitle">
          Learn the steps to take action to fight for your right to a safe and healthy home!
        </h2>
        <Link className="button is-medium is-fullwidth is-primary" to="/onboarding">Get started</Link>
        <br/>
        <p>Already have an account? <Link to="/login">Sign in!</Link></p>
      </Page>
    );
  }

  renderSignedIn() {
    return (
      <Page title="TODO SHOW SOMETHING HERE">
        <h1>TODO SHOW SOMETHING HERE</h1>
      </Page>
    );
  }

  render() {
    return (
      <AppContext.Consumer>
        {(appContext) => {
          if (appContext.session.phoneNumber) {
            return this.renderSignedIn();
          } else {
            return this.renderSignedOut();
          }
        }}
      </AppContext.Consumer>
    );
  }
}
