import React from "react";
import Page from "../ui/page";
import { OutboundLink } from "../analytics/google-analytics";
import { LandingPagePartnerLogos, getImageSrc } from "./homepage";
import { StaticImage } from "../ui/static-image";

export const NorentAboutPage: React.FC<{}> = () => (
  <Page title="About" className="content">
    <section className="hero">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet jf-space-below-2rem">
          <h2 className="title is-spaced has-text-info">Information</h2>
          <br />
          <p className="subtitle">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>
        </div>
        <br />
        <div className="container jf-has-centered-images jf-space-below-2rem">
          <StaticImage
            ratio="is-128x128"
            src={getImageSrc("justfix", "png")}
            alt=""
          />
          <p className="subtitle">
            NoRent.org is made by JustFix.nyc. JustFix.nyc co-designs and builds
            tools for tenants, housing organizers, and legal advocates fighting
            displacement in New York City.
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
        <div className="container jf-space-below-2rem">
          <p className="is-size-7 is-uppercase has-text-info has-text-weight-bold is-marginless">
            Our Partners
          </p>
          <br />
          <p className="subtitle">
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
