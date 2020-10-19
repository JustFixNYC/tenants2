import React from "react";
import Page from "../ui/page";
import { StaticImage } from "../ui/static-image";
import { Link } from "react-router-dom";
import JustfixRoutes from "../justfix-routes";
import { BigList } from "../ui/big-list";
import { OutboundLink } from "../analytics/google-analytics";
import { GetStartedButton } from "../ui/get-started-button";
import { OnboardingInfoSignupIntent } from "../queries/globalTypes";
import { MoratoriumWarning } from "../ui/covid-banners";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";
import classnames from "classnames";

export const WhyMailALetter: React.FC<{ isBigAndCentered?: boolean }> = ({
  isBigAndCentered,
}) => (
  <>
    <h2
      className={classnames(
        isBigAndCentered && "title is-spaced has-text-centered",
      )}
    >
      <Trans>Why mail a Letter of Complaint?</Trans>
    </h2>
    <Trans id="justfix.LocWhyMailALetterBlurb">
      <p className={classnames(isBigAndCentered && "subtitle")}>
        Your landlord is responsible for keeping your home and building safe and
        livable at all times. This is called the{" "}
        <strong>Warranty of Habitability</strong>.
      </p>
      <p className={classnames(isBigAndCentered && "subtitle")}>
        <strong>
          Having a record of notifying your landlord makes for a stronger legal
          case.
        </strong>{" "}
        If your landlord has already been unresponsive to your requests to make
        repairs, a letter is a <strong>great tactic to start</strong>. Through
        USPS Certified Mail<sup>&reg;</sup>, you will have an official record of
        the requests you’ve made to your landlord. Our nonprofit{" "}
        <strong>covers the cost</strong> of mailing this letter for you!
      </p>
    </Trans>
  </>
);

export function LocSplash(): JSX.Element {
  return (
    <Page
      className="jf-loc-landing-page"
      title={li18n._(t`Letter of Complaint`)}
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
              <Trans>Need Repairs in Your Apartment? Take action today!</Trans>
            </h1>
            <p className="subtitle">
              <Trans>
                This is a free tool that notifies your landlord of repair issues
                via{" "}
                <b>
                  USPS Certified Mail<sup>&reg;</sup>
                </b>
                . This service is free and secure.
              </Trans>
            </p>
            <GetStartedButton
              to={JustfixRoutes.locale.locOnboarding.latestStep}
              intent={OnboardingInfoSignupIntent.LOC}
              pageType="splash"
            >
              <Trans>Start my free letter</Trans>
            </GetStartedButton>
            <p className="jf-secondary-cta">
              <Trans>
                Already have an account?{" "}
                <Link to={JustfixRoutes.locale.login}>Sign in</Link>
              </Trans>
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
          <h2 className="title is-spaced has-text-centered">
            <Trans>How It Works</Trans>
          </h2>
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
          <Trans id="justfix.LocHowItWorksList">
            <BigList itemClassName="title is-5">
              <li>
                Customize our lawyer-approved letter template to choose the
                repairs you need in your home and/or building.
              </li>
              <li>
                We mail your letter via USPS Certified Mail
                <sup>&reg;</sup> - for free!
              </li>
              <li>Wait for your landlord to contact you directly.</li>
              <li>
                We'll text you to see how things are going after a few weeks.
              </li>
              <li>
                If repairs aren't made, learn about additional tactics like{" "}
                <Link to={JustfixRoutes.locale.hp.splash}>
                  suing your landlord
                </Link>{" "}
                in Housing Court.
              </li>
            </BigList>
          </Trans>
          <GetStartedButton
            to={JustfixRoutes.locale.locOnboarding.latestStep}
            intent={OnboardingInfoSignupIntent.LOC}
            pageType="splash"
          >
            <Trans>Start my free letter</Trans>
          </GetStartedButton>
        </div>
      </section>

      <section className="section">
        <WhyMailALetter isBigAndCentered />
      </section>

      <section className="section section--fullwidth">
        <h2 className="title is-spaced has-text-centered">
          <Trans>Hear from tenants who have used JustFix.nyc</Trans>
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
                <Trans id="justfix.LocUserTestimonial1">
                  <p className="subtitle has-text-centered is-spaced">
                    They were terrific because their letter got results that
                    mine didn’t. The letters from JustFix.nyc got my landlord to
                    do the work. Now anytime I call, my landlord gets things
                    done.
                  </p>
                  <p className="title has-text-centered is-5">
                    Veronica, 45 years old <br /> Hamilton Heights
                  </p>
                </Trans>
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
                <Trans id="justfix.LocUserTestimonial2">
                  <p className="subtitle has-text-centered is-spaced">
                    I like that you texted me to check in on my status. You all
                    were the first online advocacy group I’ve seen that was
                    accessible and easy to use. JustFix.nyc’s digital platform
                    has definitely been a game changer.
                  </p>
                  <p className="title has-text-centered is-5">
                    Steven, 36 years old <br /> East New York
                  </p>
                </Trans>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="title is-spaced has-text-centered">
          <Trans>About our nonprofit organization</Trans>
        </h2>
        <p className="subtitle">
          <Trans id="justfix.LocAboutOurNonprofitBlurb">
            JustFix.nyc co-designs and builds tools for tenants, housing
            organizers, and legal advocates fighting displacement in New York
            City. We encourage tenants to take action and fight for safe and
            healthy homes. Want to know more?{" "}
            <OutboundLink href="https://www.justfix.nyc/our-mission">
              Visit our website.
            </OutboundLink>
          </Trans>
        </p>
        <div className="notification is-warning">
          <p className="subtitle">
            <Trans id="justfix.LocDisclaimer">
              <strong>Disclaimer:</strong> The information contained in
              JustFix.nyc does not constitute legal advice and must not be used
              as a substitute for the advice of a lawyer qualified to give
              advice on legal issues pertaining to housing. We can help direct
              you to free and/or low-cost legal services as necessary.
            </Trans>
          </p>
        </div>
      </section>
    </Page>
  );
}
