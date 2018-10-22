import React from 'react';

import Page from '../page';
import { Link, Redirect } from 'react-router-dom';
import Routes from '../routes';
import { OutboundLink } from '../google-analytics';
import { CenteredPrimaryButtonLink } from '../buttons';

const locSvg = require('../svg/letter-of-complaint.svg') as JSX.Element;

export interface IndexPageProps {
  isLoggedIn: boolean;
}

export default class IndexPage extends React.Component<IndexPageProps> {
  renderLoggedOut() {
    return (
      <Page className="landing-page" title="Technology for Housing Justice">

        <section className="hero is-light">
          <div className="hero-body">
            <div className="has-text-centered">
              <div className="jf-loc-image">
                {locSvg}
              </div>
              <h1 className="title is-spaced">
                Is your landlord not responding? Take action today!
              </h1>
              <h2 className="subtitle">
                JustFix.nyc is a free tool that notifies your landlord of repair issues via <b>USPS<sup>&copy;</sup> Certified Mail</b>. Everything is kept confidential and secure.
              </h2>
              <CenteredPrimaryButtonLink to={Routes.onboarding.latestStep} className="is-large">
                Start my letter
              </CenteredPrimaryButtonLink>
              <p className="secondary-cta">Already have an account? <Link to={Routes.login}>Sign in!</Link></p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="content">
            <h1 className="has-text-centered">How It Works</h1>
            <div className="how-it-works columns is-multiline">
              <div className="column is-half">
                <div className="notification">
                  <div className="num"><h1>1</h1></div>
                  <h5>Customize your letter with a room-by-room issue checklist. We use a lawyer-approved template!</h5>
                </div>
              </div>
              <div className="column is-half">
                <div className="notification">
                  <div className="num"><h1>2</h1></div>
                  <h5>JustFix.nyc handles the official Certified Mailing process on your behalf.</h5>
                </div>
              </div>
              <div className="column is-half">
                <div className="notification">
                  <div className="num"><h1>3</h1></div>
                  <h5>Wait for your landlord to contact you directly. We'll check in to make sure they follow through.</h5>
                </div>
              </div>
              <div className="column is-half">
                <div className="notification">
                  <div className="num"><h1>4</h1></div>
                  <h5>If repairs aren't made, learn about additional tactics - including legal actions.</h5>
                </div>
              </div>
            </div>
            <CenteredPrimaryButtonLink to={Routes.onboarding.latestStep} className="is-large">
              Start my letter
            </CenteredPrimaryButtonLink>
          </div>
        </section>

        <section className="section">
          <h1 className="title is-spaced has-text-centered">What are the benefits of mailing a Certified Letter of Complaint?</h1>
          <h5 className="subtitle">
            Your landlord is responsible for keeping your apartment and the building safe and livable at all times. This is called the <strong>Warranty of Habitability</strong>.
          </h5>
          <h5 className="subtitle">
            If your landlord has been unresponsive to your requests to make repairs, a letter is a great tactic! By mailing a Letter of Complaint via Certified mail, you will have an official record of the requests you’ve made to your landlord. <strong>It is also good to have this letter as evidence for a future legal action.</strong>
          </h5>
        </section>

        <section className="section">
          <h1 className="title is-spaced has-text-centered">About JustFix.nyc</h1>
          <h5 className="subtitle">
            JustFix.nyc is a nonprofit that builds tools for tenants and organizers fighting displacement. We encourage tenants to take affirmative actions to fight for safe and healthy homes. Want to know more? <OutboundLink href="https://www.justfix.nyc/our-mission">Visit our website.</OutboundLink>
          </h5>
          <h5 className="subtitle"><strong>Disclaimer:</strong> The information contained in JustFix.nyc does not constitute legal advice and must not be used as a substitute for the advice of a lawyer qualified to give advice on legal issues pertaining to housing. We can help direct you to free and/or low-cost legal services as necessary.</h5>
        </section>

      </Page>
    );
  }

  renderLoggedIn() {
    return (
      <Redirect to={Routes.loc.latestStep} />
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
