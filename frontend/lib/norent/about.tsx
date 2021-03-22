import React from "react";
import Page from "../ui/page";
import { OutboundLink } from "../ui/outbound-link";
import { getNorentImageSrc, JumpArrow } from "./homepage";
import { StaticImage } from "../ui/static-image";
import { JustfixLogo } from "./components/logo";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";

type PartnerLogo = {
  name: string;
  srcName: string;
  href: string;
};

const partnerLogoItems: () => PartnerLogo[] = () => [
  {
    name: li18n._(t`Community Justice Project`),
    srcName: "cjp",
    href: "http://communityjusticeproject.com/",
  },
  {
    name: li18n._(t`Right to the City`),
    srcName: "rttc",
    href: "https://righttothecity.org/",
  },
  {
    name: li18n._(t`Movement Law Lab`),
    srcName: "mll",
    href: "https://movementlawlab.org/",
  },
  {
    name: li18n._(t`Manufactured Housing Action`),
    srcName: "mha",
    href: "https://mhaction.org/",
  },
  {
    name: li18n._(t`Strategic Actions for a Just Economy`),
    srcName: "saje",
    href: "https://www.saje.net/",
  },
  {
    name: li18n._(t`Housing Justice for All`),
    srcName: "hj4a",
    href: "https://www.housingjusticeforall.org/",
  },
];

export const PartnerLogos = () => (
  <div className="jf-partner-logos columns is-mobile is-multiline is-variable is-8-desktop">
    {partnerLogoItems().map((partnerDetails, i) => (
      <div
        className="column is-one-third-tablet is-half-mobile jf-has-centered-images is-paddingless"
        key={i}
      >
        <OutboundLink
          href={partnerDetails.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <StaticImage
            ratio="is-128x128"
            src={getNorentImageSrc(partnerDetails.srcName, "png")}
            alt={partnerDetails.name}
          />
        </OutboundLink>
      </div>
    ))}
  </div>
);

export const NorentAboutPage: React.FC<{}> = () => (
  <Page title={li18n._(t`About`)} className="content">
    <section className="hero is-medium">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <h2 className="title is-spaced has-text-info">
            <Trans>About</Trans>
          </h2>
          <br />
          <p className="subtitle">
            <Trans>
              Learn about why we made this tool, who we are, and who our
              partners are.
            </Trans>
          </p>
        </div>
      </div>
      <br />
      <div className="container jf-has-centered-images jf-space-below-2rem">
        <JumpArrow to="#more-info" altText={li18n._(t`Learn more`)} />
        <br />
      </div>
    </section>

    <section className="hero" id="more-info">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <h2 className="title is-spaced">
            <Trans>Why we made this</Trans>
          </h2>
          <br />
          <p className="subtitle is-size-5">
            <Trans id="norent.explanationAboutWhyWeMadeThisSite">
              Tenants across the nation are being impacted by COVID-19 in ways
              that are affecting their abilities to pay rent. We made this tool
              to empower tenants to exercise their rights during this pandemic.
            </Trans>
          </p>
          <br />
        </div>
      </div>
    </section>

    <section className="hero has-background-white-ter">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <h2 className="title is-spaced">
            <Trans>Who we are</Trans>
          </h2>
          <br />
          <JustfixLogo isHyperlinked />
          <p className="subtitle is-size-5">
            <Trans id="norent.madeByBlurb">
              NoRent.org is made by{" "}
              <OutboundLink
                className="has-text-weight-normal"
                href="https://www.justfix.nyc/"
                target="_blank"
                rel="noopener noreferrer"
              >
                JustFix.nyc
              </OutboundLink>
              , a non-profit organization that co-designs and builds tools for
              tenants, housing organizers, and legal advocates fighting
              displacement in New York City.
            </Trans>
          </p>
          <br />
          <OutboundLink
            className="is-size-5 has-text-weight-normal"
            href="https://www.justfix.nyc/our-mission"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Trans>Learn more about our mission on our website</Trans>
          </OutboundLink>
          <br />
        </div>
      </div>
    </section>

    <section className="hero">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <h2 className="title is-spaced">
            <Trans>Our Partners</Trans>
          </h2>
          <br />
          <p className="subtitle is-size-5">
            <Trans>
              NoRent.org is a collaboration between JustFix.nyc and legal
              organizations and housing rights non-profits across the nation.
            </Trans>
          </p>
          <br />
        </div>
        <div className="container jf-tight-container jf-space-below-2rem">
          <PartnerLogos />
        </div>
      </div>
    </section>
  </Page>
);
