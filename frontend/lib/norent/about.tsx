import React from "react";
import Page from "../ui/page";
import { OutboundLink } from "../analytics/google-analytics";
import { LandingPagePartnerLogos, getImageSrc } from "./homepage";
import { StaticImage } from "../ui/static-image";

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
