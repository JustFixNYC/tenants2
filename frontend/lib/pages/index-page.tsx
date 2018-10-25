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
                JustFix.nyc is a free tool that notifies your landlord of repair issues via <b>USPS Certified Mail<sup>&reg;</sup></b>. Everything is documented, confidential, and secure.
              </h2>
              <CenteredPrimaryButtonLink to={Routes.onboarding.latestStep} className="is-large">
                Start my free letter
              </CenteredPrimaryButtonLink>
              <p className="secondary-cta">Already have an account? <Link to={Routes.login}>Sign in!</Link></p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="content">
            <h2 className="title is-spaced has-text-centered">How It Works</h2>
            <div className="how-it-works columns is-multiline">
              <div className="column is-half">
                <div className="notification">
                  <div className="num"><span className="title is-3">1</span></div>
                  <h5>Customize your letter with a room-by-room issue checklist. We use a lawyer-approved template.</h5>
                </div>
              </div>
              <div className="column is-half">
                <div className="notification">
                  <div className="num"><span className="title is-3">2</span></div>
                  <h5>JustFix.nyc mails your letter via USPS Certified Mail<sup>&reg;</sup> - for free!</h5>
                </div>
              </div>
              <div className="column is-half">
                <div className="notification">
                  <div className="num"><span className="title is-3">3</span></div>
                  <h5>Wait for your landlord to contact you directly. We'll check in to make sure they follow through.</h5>
                </div>
              </div>
              <div className="column is-half">
                <div className="notification">
                  <div className="num"><span className="title is-3">4</span></div>
                  <h5>If repairs aren't made, learn about additional tactics like organizing and legal actions.</h5>
                </div>
              </div>
            </div>
            <CenteredPrimaryButtonLink to={Routes.onboarding.latestStep} className="is-large">
              Start my free letter
            </CenteredPrimaryButtonLink>
          </div>
        </section>

        <section className="section">
          <h2 className="title is-spaced has-text-centered">Why mail a Letter of Complaint?</h2>
          <h5 className="subtitle">
            Your landlord is responsible for keeping your apartment and the building safe and livable at all times. This is called the <strong>Warranty of Habitability</strong>.
          </h5>
          <h5 className="subtitle">
            <strong>Having a record of notifying your landlord makes for a stronger legal case.</strong> If your landlord has already been unresponsive to your requests to make repairs, a letter is a <strong>great tactic to start</strong>. Through USPS Certified Mail<sup>&reg;</sup>, you will have an official record of the requests you’ve made to your landlord. Our nonprofit <strong>covers the cost</strong> of mailing this letter for you!
          </h5>
        </section>

        <section className="section section--fullwidth">
          <h2 className="title is-spaced has-text-centered">Hear from tenants who have used JustFix.nyc</h2>
          <div className="tile is-ancestor">
            <div className="tile is-parent is-6">
              <div className="tile is-child box">
                <div className="media">
                  <div className="media-left">
                    <p className="image is-96x96 is-square">
                      <img className="is-rounded" src={`/static/frontend/img/veronica.jpg`} alt="Veronica photo" />
                    </p>
                  </div>
                  <div className="media-content">
                    <p className="subtitle is-spaced">
                      They were terrific because their letter got results that mine didn’t. The letters from JustFix.nyc got my landlord to do the work. Now anytime I call, my landlord gets things done.
                    </p>
                    <h5 className="title is-5">
                      Veronica, 45 years old <br /> Hamilton Heights
                    </h5>
                  </div>
                </div>
              </div>
            </div>
            <div className="tile is-parent is-6">
              <div className="tile is-child box">
                <div className="media">
                  <div className="media-left">
                    <p className="image is-96x96 is-square">
                      <img className="is-rounded" src={`/static/frontend/img/steven.png`} alt="Veronica photo" />
                    </p>
                  </div>
                  <div className="media-content">
                    <p className="subtitle is-spaced">
                      I like that you texted me to check in on my status. You all were the first online advocacy group I’ve seen that was accessible and easy to use. JustFix.nyc’s digital platform has definitely been a game changer.
                    </p>
                    <h5 className="title is-5">
                      Steven, 36 years old <br /> East New York
                    </h5>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

        <section className="section">
          <h2 className="title is-spaced has-text-centered">About our nonprofit organization</h2>
          <h5 className="subtitle">
            JustFix.nyc is a tenants rights nonprofit that builds tools for tenants and organizers fighting displacement in NYC. We encourage tenants to take action and fight for safe and healthy homes. Want to know more? <OutboundLink href="https://www.justfix.nyc/our-mission">Visit our website.</OutboundLink>
          </h5>
          <div className="notification is-warning">
            <h5 className="subtitle">
              <strong>Disclaimer:</strong> The information contained in JustFix.nyc does not constitute legal advice and must not be used as a substitute for the advice of a lawyer qualified to give advice on legal issues pertaining to housing. We can help direct you to free and/or low-cost legal services as necessary.
            </h5>
          </div>

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
