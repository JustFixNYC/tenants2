import { t, Trans } from "@lingui/macro";
import React from "react";
import { OutboundLink } from "../analytics/google-analytics";
import { li18n } from "../i18n-lingui";
import { LocalizedOutboundLink } from "../ui/localized-outbound-link";
import Page from "../ui/page";

export const EvictionFreeAboutPage: React.FC<{}> = () => (
  <Page title={li18n._(t`About`)} className="content">
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
              their eviction case until May 1st, 2021, if they fill out a
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
              enough to protect folks beyond May 1st, our tool connects tenants
              to the larger tenant movement so we can #CancelRent.
            </Trans>
          </p>
          <br />
        </div>
      </div>
    </section>

    <section className="hero has-background-white-ter">
      <div className="hero-body">
        <div className="container">
          <h2 className="title is-spaced jf-has-text-centered-tablet">
            <Trans>Who we are</Trans>
          </h2>
          <br />
          <p className="subtitle is-size-5">
            <Trans id="evictionfree.rtcBlurb">
              The{" "}
              <OutboundLink href="https://www.righttocounselnyc.org/">
                Right to Counsel NYC Coalition
              </OutboundLink>{" "}
              is a tenant-led, broad-based coalition that formed in 2014 to
              disrupt Housing Court as a center of displacement and stop the
              eviction crisis that has threatened our families, our
              neighborhoods and our homes for too long. Made up of tenants,
              organizers, advocates, legal services organizations and more, we
              are building campaigns for an eviction-free NYC and ultimately for
              a right to housing.
            </Trans>
          </p>
          <br />
          <p className="subtitle is-size-5">
            <Trans id="evictionfree.hj4aBlurb">
              <OutboundLink href="https://twitter.com/housing4allNY">
                Housing Justice for All
              </OutboundLink>{" "}
              is a coalition of over 100 organizations, from Brooklyn to
              Buffalo, that represent tenants and homeless New Yorkers. We are
              united in our belief that housing is a human right; that no person
              should live in fear of an eviction; and that we can end the
              homelessness crisis in our State.
            </Trans>
          </p>
          <br />
          <p className="subtitle is-size-5">
            <Trans id="evictionfree.justfixBlurb">
              <LocalizedOutboundLink
                hrefs={{
                  en: "https://www.justfix.nyc/en/",
                  es: "https://www.justfix.nyc/es/",
                }}
              >
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
  </Page>
);
