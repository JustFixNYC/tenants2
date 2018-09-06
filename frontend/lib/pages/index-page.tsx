import React from 'react';

import Page from '../page';
import { Link } from 'react-router-dom';
import Routes from '../routes';

export interface IndexPageProps {
  isLoggedIn: boolean;
}

export default class IndexPage extends React.Component<IndexPageProps> {
  renderLoggedOut() {
    return (
      <Page title="Technology for Housing Justice">
        <div className="content">
        <h1>Need repairs in your apartment? JustFix.nyc will mail a letter to your landlord!</h1>
        <p>
          Sending a letter of complaint to your landlord will help document all the issues that need to be fixed.
        </p>
        <Link className="button is-medium is-fullwidth is-primary" to={Routes.onboarding.latestStep}>Get started</Link>
        <br/>
        <p>Already have an account? <Link to={Routes.login}>Sign in!</Link></p>

        <h2>Why mail a Certified Letter of Complaint?</h2>

        <p>
          Under the Warranty of Habitability, your landlord is responsible for keeping your apartment and the building safe and livable at all times.
        </p>

        <p>
          In order to have an official record of the requests you've made to your landlord, you should send to mail a Letter of Complaint to your landlord via Certified Mail. We've drafted this letter for you, and we can also mail this letter on your behalf! All you need to do are enter the issues you are experiencing.
        </p>

        <Link className="button is-medium is-fullwidth is-primary" to={Routes.onboarding.latestStep}>Get started</Link>

        <h2>About JustFix.nyc</h2>

        <p>
          JustFix.nyc is a nonprofit that builds tools for tenants and organizers fighting displacement. We encourage tenants to take affirmative actions to fight for safe and healthy homes. Want to know more? <a href="https://www.justfix.nyc">Visit our website.</a>
        </p>

        <p><strong>Disclaimer:</strong> The information contained in JustFix.nyc does not constitute legal advice and must not be used as a substitute for the advice of a lawyer qualified to give advice on legal issues pertaining to housing. We can help direct you to free and/or low-cost legal services as necessary.</p>

        </div>
      </Page>
    );
  }

  renderLoggedIn() {
    return (
      <Page title="Hello authenticated user!">
        <h1 className="title">Hello authenticated user!</h1>
        <p>We still need to implement the whole Letter of Complaint thing.</p>
      </Page>
    );
  }

  render() {
    if (this.props.isLoggedIn) {
      return this.renderLoggedIn();
    } else {
      return this.renderLoggedOut();
    }
  }
}
