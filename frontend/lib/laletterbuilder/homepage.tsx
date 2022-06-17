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
    <section className="hero is-fullheight-with-navbar jf-laletterbuilder-landing-section-primary">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <h1 className="title is-spaced has-text-info">
            <Trans>As an LA resident, you have a right to safe housing.</Trans>
          </h1>
          <br />
          <p className="subtitle">
            <Trans>
              Exercise your tenant rights. Send a free letter of complaint to
              your landlord in minutes.
            </Trans>
          </p>
          <br />
          <CenteredPrimaryButtonLink to={Routes.locale.chooseLetter}>
            <Trans>See which letter is right for me</Trans>
          </CenteredPrimaryButtonLink>
        </div>
      </div>
    </section>
    <section className="jf-laletterbuilder-landing-section-secondary">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <h2 className="is-spaced has-text-info">
            <Trans>Legally vetted</Trans>
          </h2>
          <br />
          <p className="subtitle">
            <Trans>
              We built the LA Letter Builder with lawyers and non-profit tenants
              rights organizations in Los Angeles to ensure that your letter
              gives you the most protections.
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
        <div className="container jf-has-text-centered-tablet">
          <h2 className="is-spaced">
            <Trans>How it works</Trans>
          </h2>
          <div className="text-section">
            <p className="subtitle">
              <Trans>Build your letter</Trans>
            </p>
            <label>
              <Trans>
                Answer some basic questions about your situation, and we will
                automatically build a letter for you.
              </Trans>
            </label>
          </div>
          <div className="text-section">
            <p className="subtitle">
              <Trans>Send for free</Trans>
            </p>
            <label>
              <Trans>
                We will send the letter to your landlord or property manager for
                free via certified mail. Or you can opt to print and mail it
                yourself.
              </Trans>
            </label>
          </div>
          <div className="text-section">
            <p className="subtitle">
              <Trans>Follow up</Trans>
            </p>
            <label>
              <Trans>
                We'll check in with you via text message, see if your situation
                improved and offer next steps.
              </Trans>
            </label>
          </div>
        </div>
      </div>
    </section>
    <section className="jf-laletterbuilder-landing-section-primary">
      <div className="hero-body">
        <div className="jf-accordion-list-large container jf-has-text-centered-tablet">
          <h2 className="is-spaced">
            <Trans>Frequently asked questions</Trans>
          </h2>
          {faqContent.map((el) => (
            <Accordion
              question={el.question}
              questionClassName="has-text-primary"
              extraClassName="jf-laletterbuilder-faq-accordion"
            >
              {el.answer}
            </Accordion>
          ))}
        </div>
      </div>
    </section>
    <section className="jf-laletterbuilder-landing-section-secondary">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <h2 className="is-spaced">
            <Trans>Additional resources</Trans>
          </h2>

          <p className="subtitle">
            <Trans>Get involved in your community</Trans>
          </p>
          <div className="text-section">
            <label>
              <Trans>
                Attend SAJE's Tenant Action Clinic to learn more about your
                rights.
              </Trans>
            </label>
          </div>

          <div className="text-section">
            <label>
              <Trans>
                Volunteer with SAJE and help other members of your community
                defend their rights as tenants.
              </Trans>
            </label>
          </div>
          <p className="subtitle">
            <Trans>Other tools</Trans>
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
