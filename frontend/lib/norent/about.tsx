import React from "react";
import Page from "../ui/page";
import { OutboundLink } from "../analytics/google-analytics";
import { getImageSrc, JumpArrow } from "./homepage";
import { StaticImage } from "../ui/static-image";
import { JustfixLogo } from "./components/logo";

type PartnerLogo = {
  name: string;
  srcName: string;
  href: string;
};

const partnerLogoItems: PartnerLogo[] = [
  {
    name: "Community Justice Project",
    srcName: "cjp",
    href: "http://communityjusticeproject.com/",
  },
  {
    name: "Right to the City",
    srcName: "rttc",
    href: "https://righttothecity.org/",
  },
  {
    name: "Movement Law Lab",
    srcName: "mll",
    href: "https://movementlawlab.org/",
  },
  {
    name: "Manufactured Housing Action",
    srcName: "mha",
    href: "https://mhaction.org/",
  },
];

export const PartnerLogos = () => (
  <div className="jf-partner-logos columns is-mobile is-multiline is-variable is-8-desktop">
    {partnerLogoItems.map((partnerDetails, i) => (
      <div
        className="column is-one-fourth jf-has-centered-images is-paddingless"
        key={i}
      >
        <OutboundLink
          href={partnerDetails.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <StaticImage
            ratio="is-128x128"
            src={getImageSrc(partnerDetails.srcName, "png")}
            alt={partnerDetails.name}
          />
        </OutboundLink>
      </div>
    ))}
  </div>
);

export const NorentAboutPage: React.FC<{}> = () => (
  <Page title="About" className="content">
    <section className="hero is-medium">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <h2 className="title is-spaced has-text-info">About</h2>
          <br />
          <p className="subtitle">
            Learn about why we made this tool, who we are, and who our partners
            are.
          </p>
        </div>
      </div>
      <div className="container jf-has-centered-images jf-space-below-2rem">
        <JumpArrow to="#more-info" altText="Learn more" />
        <br />
      </div>
    </section>

    <section className="hero" id="more-info">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <h2 className="title is-spaced">Why We Made This</h2>
          <br />
          <p className="subtitle is-size-5">
            Tenants across the nation are being impacted by COVID-19 in ways
            that are affecting their abilities to pay rent. We made this tool to
            empower tenants to exercise their rights during this pandemic.
          </p>
          <br />
        </div>
      </div>
    </section>

    <section className="hero has-background-white-ter">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <h2 className="title is-spaced">Who We Are</h2>
          <br />
          <JustfixLogo isHyperlinked />
          <p className="subtitle is-size-5">
            NoRent.org is made by{" "}
            <OutboundLink
              className="has-text-weight-normal"
              href="https://www.justfix.nyc/"
              target="_blank"
              rel="noopener noreferrer"
            >
              JustFix.nyc
            </OutboundLink>
            . JustFix.nyc co-designs and builds tools for tenants, housing
            organizers, and legal advocates fighting displacement in New York
            City.
          </p>
          <br />
          <OutboundLink
            className="is-size-5 has-text-weight-normal"
            href="https://www.justfix.nyc/our-mission"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more about our mission on our website
          </OutboundLink>
          <br />
        </div>
      </div>
    </section>

    <section className="hero">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <h2 className="title is-spaced">Our Partners</h2>
          <br />
          <p className="subtitle is-size-5">
            NoRent.org is a collaboration between JustFix.nyc and legal
            organizations and housing rights non-profits across the nation.
          </p>
          <br />
        </div>
        <div className="container">
          <PartnerLogos />
        </div>
      </div>
    </section>
  </Page>
);
