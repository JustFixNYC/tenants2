import React from "react";
import Page from "../ui/page";
import { StaticImage } from "../ui/static-image";
import { Link } from "react-router-dom";
import JustfixRoutes from "../justfix-route-info";
import { BigList } from "../ui/big-list";
import { OutboundLink } from "../ui/outbound-link";
import { GetStartedButton } from "../ui/get-started-button";
import { OnboardingInfoSignupIntent } from "../queries/globalTypes";
import { Icon } from "../ui/icon";
import { LeaseChoice } from "../../../common-data/lease-choices";
import classnames from "classnames";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";

type HousingTypeFormProps = {
  housingType: string;
  setHousingType: (value: string) => void;
};

const HousingTypeForm: React.FC<HousingTypeFormProps> = ({
  housingType,
  setHousingType,
}) => {
  const leaseModals = createLeaseLearnMoreModals();

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHousingType(event.target.value);
    window.sessionStorage.setItem("housingType", event.target.value);
  };

  return (
    <form className="housing-type-container">
      {leaseModals.map(({ title, leaseType, leaseInfo }) => (
        <div key={leaseType} className="housing-type-selection">
          <input
            type="radio"
            id={leaseType.toLowerCase()}
            name="housing-type"
            value={leaseType}
            checked={housingType === leaseType}
            onChange={handleRadioChange}
          />
          <label htmlFor={leaseType.toLowerCase()}>{title}</label>
          <div
            className={classnames(
              "tooltip",
              `tooltip_${leaseType.toLowerCase()}`
            )}
          >
            <Icon type="info" />
            <span className="tooltiptext">{leaseInfo}</span>
          </div>
        </div>
      ))}
    </form>
  );
};

export type LeaseMoreInfo = {
  title: string;
  leaseType: LeaseChoice;
  leaseInfo: string | JSX.Element;
};

const createLeaseLearnMoreModals = (): LeaseMoreInfo[] => [
  {
    title: li18n._(t`Rent Stabilized`),
    leaseType: "RENT_STABILIZED",
    leaseInfo: (
      <Trans>
        Housing in buildings built before January 1, 1974 with six or more
        units, including Single Room Occupancy ("SRO") hotels and rooming
        houses. All apartments in buildings that receive a tax abatement such as
        J-51, 421a, and 421g are also stabilized.
      </Trans>
    ),
  },
  {
    title: li18n._(t`Rent Controlled`),
    leaseType: "RENT_CONTROLLED",
    leaseInfo: (
      <Trans>
        This is a rare kind of housing! Buildings that had three or more
        residential units before February 1, 1947, where the tenant or immediate
        family member has been continuously living in the apartment since July
        1, 1971.
      </Trans>
    ),
  },
  {
    title: li18n._(t`Market Rate`),
    leaseType: "MARKET_RATE",
    leaseInfo: (
      <Trans>
        Market rate tenants typically live in buildings of fewer than six (6)
        units, newer buildings, or formerly rent stabilized apartments that a
        landlord deregulated before 2019.
      </Trans>
    ),
  },
  {
    title: li18n._(t`NYCHA/Public Housing (includes RAD/PACT)`),
    leaseType: "NYCHA",
    leaseInfo: (
      <Trans>
        Federally-funded affordable housing developments owned by the
        government.
      </Trans>
    ),
  },
  {
    title: li18n._(t`Affordable Housing (other than rent stabilized)`),
    leaseType: "OTHER_AFFORDABLE",
    leaseInfo: (
      <Trans>
        New York City has many forms of affordable housing. Some common types
        include Mitchell Lama, Project-Based Section 8 buildings (also known as
        HUD), LIHTC, HDFC rentals, and others.
      </Trans>
    ),
  },
  {
    title: li18n._(t`I'm not sure`),
    leaseType: "NOT_SURE",
    leaseInfo: (
      <Trans>
        Don't know what type of housing you live in? Learn more by ordering your
        rent history <a href="https://app.justfix.org/en/rh/splash">here</a> or
        reading about{" "}
        <a href="https://rentguidelinesboard.cityofnewyork.us/resources/faqs/rent-stabilization/">
          rent regulation.
        </a>
      </Trans>
    ),
  },
];

export function LocSplash(): JSX.Element {
  const [housingType, setHousingType] = React.useState("");
  const [isSafari, setIsSafari] = React.useState(false);

  React.useEffect(() => {
    window.sessionStorage.removeItem("housingType");
    // Detect Safari browser to hide YouTube video embed while Error 153 (Video Player Configuration Error) persists.
    // User agent sniffing is not recommended. Once Youtube fixes the issue, remove this
    // Logic: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Browser_detection_using_the_user_agent#browser_name_and_version
    const userAgent = navigator.userAgent.toLowerCase();
    const isSafariBrowser =
      userAgent.indexOf("safari") > -1 &&
      userAgent.indexOf("chrome") === -1 &&
      userAgent.indexOf("chromium") === -1;
    setIsSafari(isSafariBrowser);
  }, []);

  return (
    <Page className="jf-loc-landing-page" title={li18n._(t`Letter of Complaint`)}>
      <section className="hero is-light">
        <div className="hero-body">
          <h1 className="title is-spaced">
            <Trans>
              Need repairs in your home?
              <br />
              Take action today!
            </Trans>
          </h1>
          <p className="subtitle">
            <Trans>
              Create a letter that notifies your landlord of repair issues via
              USPS Certified Mail<sup>&reg;</sup>. This service is free, secure,
              and legally vetted.
            </Trans>
            <br />
            <br />
            <Trans>Select your housing type to get started:</Trans>
          </p>
          <HousingTypeForm
            housingType={housingType}
            setHousingType={setHousingType}
          />
          <GetStartedButton
            to={JustfixRoutes.locale.locOnboarding.latestStep}
            intent={OnboardingInfoSignupIntent.LOC}
            pageType="splash"
          >
            <Trans>Start my free letter</Trans>
          </GetStartedButton>
          <p className="jf-secondary-cta has-text-centered">
            <Trans>
              Already have an account?{" "}
              <Link to={JustfixRoutes.locale.login}>Sign in</Link>
            </Trans>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="content">
          <h2 className="title is-spaced has-text-centered">
            <Trans>How It Works</Trans>
          </h2>
          {!isSafari && (
            <figure className="image is-16by9">
              <iframe
                className="has-ratio"
                src="https://www.youtube.com/embed/hg64IsJl0O4?si=DCSpveNLTFzlid2C"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            </figure>
          )}
          <BigList itemClassName="title is-5">
            <li>
              <Trans>
                Customize our lawyer-approved letter template to choose the
                repairs you need in your home and/or building.
              </Trans>
            </li>
            <li>
              <Trans>
                We mail your letter via USPS Certified Mail
                <sup>&reg;</sup> - for free!
              </Trans>
            </li>
            <li>
              <Trans>Wait for your landlord to contact you directly.</Trans>
            </li>
            <li>
              <Trans>
                We'll text you to see how things are going after a few weeks.
              </Trans>
            </li>
          </BigList>
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
        <h2 className="title is-spaced has-text-centered">
          <Trans>Why mail a Letter of Complaint?</Trans>
        </h2>
        <p className="subtitle">
          <Trans>
            Your landlord is responsible for keeping your home and building safe
            and livable at all times. This is called the{" "}
            <strong>Warranty of Habitability</strong>.
          </Trans>
        </p>
        <p className="subtitle">
          <Trans>
            <strong>
              Having a record of notifying your landlord makes for a stronger
              legal case.
            </strong>{" "}
            If your landlord has already been unresponsive to your requests to
            make repairs, a letter is a <strong>great tactic to start</strong>.
            Through USPS Certified Mail<sup>&reg;</sup>, you will have an official
            record of the requests you've made to your landlord. Our nonprofit{" "}
            <strong>covers the cost</strong> of mailing this letter for you!
          </Trans>
        </p>
      </section>

      <section className="section section--fullwidth">
        <h2 className="title is-spaced has-text-centered">
          <Trans>Hear from tenants who have used JustFix</Trans>
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
                    alt={li18n._(t`Veronica photo`)}
                  />
                </div>
                <p className="subtitle has-text-centered is-spaced">
                  <Trans>
                    They were terrific because their letter got results that mine
                    didn't. The letters from JustFix got my landlord to do the
                    work. Now anytime I call, my landlord gets things done.
                  </Trans>
                </p>
                <p className="title has-text-centered is-5">
                  <Trans>
                    Veronica, 45 years old <br /> Hamilton Heights
                  </Trans>
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
                    alt={li18n._(t`Steven photo`)}
                  />
                </div>
                <p className="subtitle has-text-centered is-spaced">
                  <Trans>
                    I like that you texted me to check in on my status. You all
                    were the first online advocacy group I've seen that was
                    accessible and easy to use. JustFix's digital platform has
                    definitely been a game changer.
                  </Trans>
                </p>
                <p className="title has-text-centered is-5">
                  <Trans>
                    Steven, 36 years old <br /> East New York
                  </Trans>
                </p>
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
          <Trans>
            JustFix co-designs and builds tools for tenants, housing organizers,
            and legal advocates fighting displacement in New York City. We
            encourage tenants to take action and fight for safe and healthy homes.
            Want to know more?{" "}
            <OutboundLink href="https://www.justfix.org/our-mission">
              Visit our website.
            </OutboundLink>
          </Trans>
        </p>
        <div className="notification is-warning">
          <p className="subtitle">
            <Trans>
              <strong>Disclaimer:</strong> The information contained in JustFix
              does not constitute legal advice and must not be used as a
              substitute for the advice of a lawyer qualified to give advice on
              legal issues pertaining to housing. We can help direct you to free
              and/or low-cost legal services as necessary.
            </Trans>
          </p>
        </div>
      </section>
    </Page>
  );
}
