import React from 'react';

import Page from '../page';
import { Link, Redirect } from 'react-router-dom';
import Routes from '../routes';
import { WhyMailALetterOfComplaint } from '../letter-of-complaint-common';
import { OutboundLink } from '../google-analytics';

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

        <WhyMailALetterOfComplaint heading="h2" />

        <Link className="button is-medium is-fullwidth is-primary" to={Routes.onboarding.latestStep}>Get started</Link>

        <h2>About JustFix.nyc</h2>

        <p>
          JustFix.nyc is a nonprofit that builds tools for tenants and organizers fighting displacement. We encourage tenants to take affirmative actions to fight for safe and healthy homes. Want to know more? <OutboundLink href="https://www.justfix.nyc">Visit our website.</OutboundLink>
        </p>

        <p><strong>Disclaimer:</strong> The information contained in JustFix.nyc does not constitute legal advice and must not be used as a substitute for the advice of a lawyer qualified to give advice on legal issues pertaining to housing. We can help direct you to free and/or low-cost legal services as necessary.</p>

        </div>
      </Page>
    );
  }

  renderLoggedIn() {
    return (
      <Redirect to={Routes.loc.home} />
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
