import React from "react";
import Page from "../ui/page";
import { OutboundLink } from "../analytics/google-analytics";
import { getImageSrc } from "./homepage";
import { StaticImage } from "../ui/static-image";

const partnerLogoItems = [
  ["Community Justice Project", "cjp"],
  ["Right to the City", "rttc"],
  ["Manufactured Housing Action", "mha"],
];

export const PartnerLogos = () => (
  <div className="columns is-mobile is-multiline is-variable is-8-desktop">
    {partnerLogoItems.map((partnerDetails, i) => (
      <div className="column is-one-fourth jf-has-centered-images" key={i}>
        <StaticImage
          ratio="is-128x128"
          src={getImageSrc(partnerDetails[1], "png")}
          alt={partnerDetails[0]}
        />
      </div>
    ))}
  </div>
);

export const NorentAboutPage: React.FC<{}> = () => (
  <Page title="About" className="content">
    <section className="hero is-info is-medium">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <h2 className="title is-spaced">About</h2>
          <br />
          <p className="subtitle">
            Learn about why we made this tool, who we are, and who are partners
            are.
          </p>
        </div>
      </div>
    </section>

    <section className="hero">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <h2 className="title is-spaced">Why We Made This</h2>
          <br />
          <p className="subtitle is-size-5">
            Tenants across the nation are being impacted by COVID-19 in ways
            that are affecting their abilities to pay rent. We made this tool to
            empower tenants to exercise their rights during this pandemic.
          </p>
        </div>
      </div>
    </section>

    <section className="hero has-background-white-ter">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <h2 className="title is-spaced">Who We Are</h2>
          <br />
          <div className="jf-justfix-logo">
            <StaticImage
              ratio="is-3by1"
              src={getImageSrc("justfix", "png")}
              alt=""
            />
          </div>
          <p className="subtitle is-size-5">
            NoRent.org is made by{" "}
            <OutboundLink
              className="has-text-weight-normal"
              href="https://www.justfix.nyc/"
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
        <div className="container jf-has-text-centered-tablet ">
          <h2 className="title is-spaced">Our Partners</h2>
          <br />
          <p className="subtitle is-size-5">
            NoRent.org is a collaboration between JustFix.nyc and legal
            organizations and housing rights non-profits across the nation.
          </p>
          <br />
        </div>
        <div className="container">
          <LandingPagePartnerLogos />
        </div>
      </div>
    </section>
  </Page>
);
