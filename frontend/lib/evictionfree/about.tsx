import { t, Trans } from "@lingui/macro";
import React from "react";
import { OutboundLink } from "../ui/outbound-link";
import { li18n } from "../i18n-lingui";
import { getNorentImageSrc } from "../norent/homepage";
import { LocalizedOutboundLink } from "../ui/localized-outbound-link";
import Page from "../ui/page";
import { StaticImage } from "../ui/static-image";
import { HCA_HOTLINE_PHONE_LINK } from "./declaration-builder/confirmation";
import {
  getEFImageSrc,
  HJ4A_SOCIAL_URL,
  JUSTFIX_WEBSITE_URLS,
  RTC_WEBSITE_URL,
  StickyLetterButtonContainer,
} from "./homepage";

export const AdditionalSupportBanner = () => (
  <section className="hero is-info">
    <div className="hero-body">
      <div className="container jf-has-text-centered-tablet">
        <h2 className="is-spaced has-text-white has-text-weight-bold">
          <Trans>Need additional support?</Trans>
        </h2>
        <br />
        <p className="subtitle is-size-4">
          <Trans>
            Call the Housing Court Answers hotline at{" "}
            <OutboundLink
              href={HCA_HOTLINE_PHONE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="jf-word-glue"
            >
              212-962-4795
            </OutboundLink>
            .
          </Trans>
        </p>
        <p className="subtitle is-size-4">
          <Trans>Hours of operation: Monday to Friday, 9am - 5pm.</Trans>
        </p>
        <p className="subtitle is-size-4">
          <Trans>Available in English and Spanish.</Trans>
        </p>
      </div>
    </div>
  </section>
);

export const EvictionFreeAboutPage: React.FC<{}> = () => (
  <Page title={li18n._(t`About`)} className="content jf-evictionfree-about">
    <section className="hero">
      <div className="hero-body">
        <div className="container">
          <h2 className="title is-spaced jf-has-text-centered-tablet">
            <Trans>About</Trans>
          </h2>
          <br />
          <p className="subtitle is-size-5">
            <Trans id="evictionfree.aboutPage1">
              A new State law, passed in late 2020, allows most tenants to stop
              their eviction case until August 31st, 2021, if they fill out a
              “Hardship Declaration” form. However, this law puts the
              responsibility on tenants to figure out how to do that and doesn’t
              provide easy access to exercise their rights.
            </Trans>
          </p>
          <br />
          <p className="subtitle is-size-5">
            <Trans id="evictionfree.aboutPage2">
              Our website helps tenants submit this hardship declaration form
              with peace of mind— sending it out via free USPS Certified Mail
              and email to all of the appropriate parties (your landlord and the
              courts) to ensure protection. And since the law doesn’t go far
              enough to protect folks beyond August 31st, our tool connects
              tenants to the larger tenant movement so we can #CancelRent.
            </Trans>
          </p>
          <br />
        </div>
      </div>
    </section>

    <StickyLetterButtonContainer>
      <section className="hero has-background-white-ter">
        <div className="hero-body">
          <div className="container">
            <h2 className="title is-spaced jf-has-text-centered-tablet">
              <Trans>Who we are</Trans>
            </h2>
            <br />
            <OutboundLink href={RTC_WEBSITE_URL}>
              <StaticImage
                ratio="is-square"
                src={getEFImageSrc("rtc", "png")}
                alt="JustFix.nyc"
              />
            </OutboundLink>
            <p className="subtitle is-size-5">
              <Trans id="evictionfree.rtcBlurb">
                The{" "}
                <OutboundLink href={RTC_WEBSITE_URL}>
                  Right to Counsel NYC Coalition
                </OutboundLink>{" "}
                is a tenant-led, broad-based coalition that formed in 2014 to
                disrupt Housing Court as a center of displacement and stop the
                eviction crisis that has threatened our families, our
                neighborhoods and our homes for too long. Made up of tenants,
                organizers, advocates, legal services organizations and more, we
                are building campaigns for an eviction-free NYC and ultimately
                for a right to housing.
              </Trans>
            </p>
            <br />
            <OutboundLink href={HJ4A_SOCIAL_URL}>
              <StaticImage
                ratio="is-square"
                src={getNorentImageSrc("hj4a", "png")}
                alt="JustFix.nyc"
              />
            </OutboundLink>
            <p className="subtitle is-size-5">
              <Trans id="evictionfree.hj4aBlurb">
                <OutboundLink href={HJ4A_SOCIAL_URL}>
                  Housing Justice for All
                </OutboundLink>{" "}
                is a coalition of over 100 organizations, from Brooklyn to
                Buffalo, that represent tenants and homeless New Yorkers. We are
                united in our belief that housing is a human right; that no
                person should live in fear of an eviction; and that we can end
                the homelessness crisis in our State.
              </Trans>
            </p>
            <br />
            <LocalizedOutboundLink hrefs={JUSTFIX_WEBSITE_URLS}>
              <StaticImage
                ratio="is-3by1"
                src={getNorentImageSrc("justfix")}
                alt="JustFix.nyc"
              />
            </LocalizedOutboundLink>
            <p className="subtitle is-size-5">
              <Trans id="evictionfree.justfixBlurb">
                <LocalizedOutboundLink hrefs={JUSTFIX_WEBSITE_URLS}>
                  JustFix.nyc
                </LocalizedOutboundLink>{" "}
                co-designs and builds tools for tenants, housing organizers, and
                legal advocates fighting displacement in New York City. Our
                mission is to galvanize a 21st century tenant movement working
                towards housing for all — and we think the power of data and
                technology should be accessible to those fighting this fight.
              </Trans>
            </p>
          </div>
        </div>
      </section>
      <AdditionalSupportBanner />
    </StickyLetterButtonContainer>
  </Page>
);
