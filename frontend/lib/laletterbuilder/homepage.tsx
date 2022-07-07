import React from "react";

import { t, Trans } from "@lingui/macro";

import Page from "../ui/page";

import { LaLetterBuilderRouteInfo as Routes } from "./route-info";
import { CenteredPrimaryButtonLink } from "../ui/buttons";
import { StaticImage } from "../ui/static-image";
import { Accordion } from "../ui/accordion";
import { li18n } from "../i18n-lingui";
import { OutboundLink } from "../ui/outbound-link";
import { faqContent } from "./faq-content";

type LaLetterBuilderImageType = "png" | "svg";

export function getLaLetterBuilderImageSrc(
  name: string,
  type?: LaLetterBuilderImageType
) {
  return `frontend/img/laletterbuilder/${name}.${type || "svg"}`;
}

export const LaLetterBuilderHomepage: React.FC<{}> = () => (
  <Page title={li18n._(t`LA Letter Builder Homepage`)} className="content">
    <section className="hero jf-laletterbuilder-landing-section-primary">
      <div className="hero-body">
        <div className="container">
          <h1 className="title is-spaced has-text-info">
            <Trans>
              As a California resident, you have a right to safe housing
            </Trans>
          </h1>
          <br />
          <p className="subtitle">
            <Trans>
              Exercise your tenant rights. Send a free letter to your landlord
              in minutes.
            </Trans>
          </p>
          <br />
          <CenteredPrimaryButtonLink to={Routes.locale.chooseLetter}>
            <Trans>View letters</Trans>
          </CenteredPrimaryButtonLink>
        </div>
      </div>
    </section>
    <section className="jf-laletterbuilder-landing-section-secondary">
      <div className="hero-body">
        <div className="container">
          <h2 className="is-spaced has-text-info">
            <Trans>Legally vetted</Trans>
          </h2>
          <br />
          <p className="subtitle">
            <Trans>
              We created the [Product Name] with lawyers and non-profit tenant
              rights organizations to ensure that your letter gives you the most
              protections.
            </Trans>
          </p>
          <br />
          <div className="is-spaced has-text-info">
            <Trans>Created by</Trans>
            <StaticImage
              ratio="is-3by1"
              src={getLaLetterBuilderImageSrc(
                "justfix-saje-combined-logo-black"
              )}
              alt="JustFix SAJE"
            />
          </div>
        </div>
      </div>
    </section>
    <section className="jf-laletterbuilder-landing-section-tertiary">
      <div className="hero-body">
        <div className="container">
          <h2 className="is-spaced">
            <Trans>How it works</Trans>
          </h2>
          <div className="text-section">
            <p className="subtitle">
              <Trans>Build your letter</Trans>
            </p>
            <label>
              <Trans>
                Answer some basic questions about your housing situation, and
                we’ll automatically create a letter for you.
              </Trans>
            </label>
          </div>
          <div className="text-section">
            <p className="subtitle">
              <Trans>Mail for free</Trans>
            </p>
            <label>
              <Trans>
                We’ll send your letter to your landlord or property manager for
                free via certified mail. Or you can opt to print and mail it
                yourself.
              </Trans>
            </label>
          </div>
          <div className="text-section">
            <p className="subtitle">
              <Trans>Next steps</Trans>
            </p>
            <label>
              <Trans>
                We’ll explain additional actions you can take if your issue
                isn’t resolved
              </Trans>
            </label>
          </div>
        </div>
      </div>
    </section>
    <section className="jf-laletterbuilder-landing-section-primary">
      <div className="hero-body">
        <div className="jf-accordion-list-large container">
          <h2 className="is-spaced">
            <Trans>Frequently asked questions</Trans>
          </h2>
          {faqContent.map((el, i) => (
            <Accordion
              key={`faq-${i}`}
              question={el.question}
              questionClassName="has-text-primary"
            >
              {el.answer}
            </Accordion>
          ))}
        </div>
      </div>
    </section>
    <section className="jf-laletterbuilder-landing-section-secondary">
      <div className="hero-body">
        <div className="container">
          <h2 className="is-spaced">
            <Trans>Tenant rights resources</Trans>
          </h2>

          <p className="subtitle">
            <Trans>Get involved in your community</Trans>
          </p>
          <div className="text-section">
            <label>
              <Trans>
                Attend SAJE’s Tenant Action Clinic if you're faced with a
                housing problem.
              </Trans>
            </label>
          </div>

          <div className="text-section">
            <label>
              <Trans>
                Get involved with SAJE to build power with your neighbors
              </Trans>
            </label>
          </div>
          <p className="subtitle">
            <Trans>Resources</Trans>
          </p>
          <p>
            <OutboundLink
              href="https://www.stayhousedla.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              StayHoused LA
            </OutboundLink>
          </p>
          <p>
            <OutboundLink
              href="https://housing.lacity.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LA Housing Department
            </OutboundLink>
          </p>
        </div>
      </div>
    </section>
  </Page>
);
