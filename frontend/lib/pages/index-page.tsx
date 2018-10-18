import React from 'react';

import Page from '../page';
import { Link, Redirect } from 'react-router-dom';
import Routes from '../routes';
import { WhyMailALetterOfComplaint } from '../letter-of-complaint-common';
import { OutboundLink } from '../google-analytics';
import { CenteredPrimaryButtonLink } from '../buttons';

export interface IndexPageProps {
  isLoggedIn: boolean;
}

export default class IndexPage extends React.Component<IndexPageProps> {
  renderLoggedOut() {
    return (
      <Page title="Technology for Housing Justice">
        <div className="content">

          <section className="hero is-link is-fullheight is-fullheight-with-navbar">
            <div className="hero-body">
              <div className="container">
                <h1 className="title">
                  Fullheight hero with navbar
                </h1>
              </div>
            </div>
          </section>

        <h1>Need repairs in your apartment? JustFix.nyc will mail a letter to your landlord!</h1>
        <p>
          Sending a letter of complaint to your landlord will help document all the issues that need to be fixed.
        </p>
        <CenteredPrimaryButtonLink to={Routes.onboarding.latestStep} className="is-medium">
          Get started
        </CenteredPrimaryButtonLink>
        <p>Already have an account? <Link to={Routes.login}>Sign in!</Link></p>

        <WhyMailALetterOfComplaint heading="h2" />

        <CenteredPrimaryButtonLink to={Routes.onboarding.latestStep} className="is-medium">
          Get started
        </CenteredPrimaryButtonLink>

        <h2>About JustFix.nyc</h2>

        <p>
          JustFix.nyc is a nonprofit that builds tools for tenants and organizers fighting displacement. We encourage tenants to take affirmative actions to fight for safe and healthy homes. Want to know more? <OutboundLink href="https://www.justfix.nyc/our-mission">Visit our website.</OutboundLink>
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
