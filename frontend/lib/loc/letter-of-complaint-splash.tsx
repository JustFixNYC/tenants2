import React from "react";
import Page from "../ui/page";
import { StaticImage } from "../ui/static-image";
import { Link } from "react-router-dom";
import Routes from "../justfix-routes";
import { BigList } from "../ui/big-list";
import { OutboundLink } from "../analytics/google-analytics";
import { GetStartedButton } from "../ui/get-started-button";
import { OnboardingInfoSignupIntent } from "../queries/globalTypes";
import { MoratoriumWarning } from "../ui/covid-banners";

export function LocSplash(): JSX.Element {
  return (
    <Page
      className="jf-loc-landing-page"
      title="Technology for Housing Justice"
    >
      <section className="hero is-light">
        <div className="hero-body">
          <div className="has-text-centered">
            <div className="jf-loc-image">
              <StaticImage
                ratio="is-2by1"
                src="frontend/img/letter-of-complaint.svg"
                alt=""
              />
            </div>
            <h1 className="title is-spaced">
              Is your landlord not responding? Take action today!
            </h1>
            <p className="subtitle">
              This is a free tool that notifies your landlord of repair issues
              via{" "}
              <b>
                USPS Certified Mail<sup>&reg;</sup>
              </b>
              . This service is free and secure.
            </p>
            <GetStartedButton
              to={Routes.locale.onboarding.latestStep}
              intent={OnboardingInfoSignupIntent.LOC}
              pageType="splash"
            >
              Start my free letter
            </GetStartedButton>
            <p className="jf-secondary-cta">
              Already have an account?{" "}
              <Link to={Routes.locale.login}>Sign in!</Link>
            </p>
            <br />
            <div className="jf-secondary-cta">
              <MoratoriumWarning />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="content">
          <h2 className="title is-spaced has-text-centered">How It Works</h2>
          <figure className="image is-16by9">
            <iframe
              className="has-ratio"
              width="640"
              height="360"
              src="https://www.youtube.com/embed/hg64IsJl0O4"
              frameBorder="0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </figure>
          <BigList itemClassName="title is-5">
            <li>
              Customize your letter with a room-by-room issue checklist. We use
              a lawyer-approved template.
            </li>
            <li>
              JustFix.nyc mails your letter via USPS Certified Mail
              <sup>&reg;</sup> - for free!
            </li>
            <li>
              Wait for your landlord to contact you directly. We'll check in to
              make sure they follow through.
            </li>
            <li>
              If repairs aren't made, learn about additional tactics like
              organizing and legal actions.
            </li>
          </BigList>
          <GetStartedButton
            to={Routes.locale.onboarding.latestStep}
            intent={OnboardingInfoSignupIntent.LOC}
            pageType="splash"
          >
            Start my free letter
          </GetStartedButton>
        </div>
      </section>

      <section className="section">
        <h2 className="title is-spaced has-text-centered">
          Why mail a Letter of Complaint?
        </h2>
        <p className="subtitle">
          Your landlord is responsible for keeping your apartment and the
          building safe and livable at all times. This is called the{" "}
          <strong>Warranty of Habitability</strong>.
        </p>
        <p className="subtitle">
          <strong>
            Having a record of notifying your landlord makes for a stronger
            legal case.
          </strong>{" "}
          If your landlord has already been unresponsive to your requests to
          make repairs, a letter is a <strong>great tactic to start</strong>.
          Through USPS Certified Mail<sup>&reg;</sup>, you will have an official
          record of the requests you’ve made to your landlord. Our nonprofit{" "}
          <strong>covers the cost</strong> of mailing this letter for you!
        </p>
      </section>

      <section className="section section--fullwidth">
        <h2 className="title is-spaced has-text-centered">
          Hear from tenants who have used JustFix.nyc
        </h2>
        <div className="tile is-ancestor">
          <div className="tile is-parent is-6">
            <div className="tile is-child box">
              <div className="media-content">
                <div className="image container is-128x128">
                  <StaticImage
                    ratio="is-square"
                    className="is-rounded"
                    src="frontend/img/veronica.jpg"
                    alt="Veronica photo"
                  />
                </div>
                <p className="subtitle has-text-centered is-spaced">
                  They were terrific because their letter got results that mine
                  didn’t. The letters from JustFix.nyc got my landlord to do the
                  work. Now anytime I call, my landlord gets things done.
                </p>
                <p className="title has-text-centered is-5">
                  Veronica, 45 years old <br /> Hamilton Heights
                </p>
              </div>
            </div>
          </div>
          <div className="tile is-parent is-6">
            <div className="tile is-child box">
              <div className="media-content">
                <div className="image container is-128x128">
                  <StaticImage
                    ratio="is-square"
                    className="is-rounded"
                    src="frontend/img/steven.png"
                    alt="Steven photo"
                  />
                </div>
                <p className="subtitle has-text-centered is-spaced">
                  I like that you texted me to check in on my status. You all
                  were the first online advocacy group I’ve seen that was
                  accessible and easy to use. JustFix.nyc’s digital platform has
                  definitely been a game changer.
                </p>
                <p className="title has-text-centered is-5">
                  Steven, 36 years old <br /> East New York
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="title is-spaced has-text-centered">
          About our nonprofit organization
        </h2>
        <p className="subtitle">
          JustFix.nyc is a tenants rights nonprofit that builds tools for
          tenants and organizers fighting displacement in NYC. We encourage
          tenants to take action and fight for safe and healthy homes. Want to
          know more?{" "}
          <OutboundLink href="https://www.justfix.nyc/our-mission">
            Visit our website.
          </OutboundLink>
        </p>
        <div className="notification is-warning">
          <p className="subtitle">
            <strong>Disclaimer:</strong> The information contained in
            JustFix.nyc does not constitute legal advice and must not be used as
            a substitute for the advice of a lawyer qualified to give advice on
            legal issues pertaining to housing. We can help direct you to free
            and/or low-cost legal services as necessary.
          </p>
        </div>
      </section>
    </Page>
  );
}
