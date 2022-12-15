import React from "react";

import { Trans } from "@lingui/macro";

import Page from "../ui/page";

import { Accordion } from "../ui/accordion";
import { OutboundLink } from "../ui/outbound-link";
import { getFaqContent } from "./faq-content";
import ResponsiveElement from "./components/responsive-element";
import { logEvent } from "../analytics/util";
import { LocalizedOutboundLink } from "../ui/localized-outbound-link";
import {
  CreateLetterCard,
  StartLetterButton,
} from "./letter-builder/choose-letter";

type LaLetterBuilderImageType = "png" | "svg";

export function getLaLetterBuilderImageSrc(
  name: string,
  type?: LaLetterBuilderImageType
) {
  return `frontend/img/laletterbuilder/${name}.${type || "svg"}`;
}

export const LaLetterBuilderHomepage: React.FC<{}> = () => {
  const faqContent = getFaqContent();

  return (
    <Page title="">
      <section className="hero jf-laletterbuilder-landing-section-primary">
        <div className="hero-body">
          <div className="container">
            <h2 className="mb-5">
              <Trans>For LA residents</Trans>
            </h2>
            <ResponsiveElement className="mb-5" desktop="h3" touch="h1">
              <Trans>Need Repairs in Your home? Take action today</Trans>
            </ResponsiveElement>
            <ResponsiveElement className="mb-7" desktop="h4" touch="h3">
              <Trans>
                This is a free tool that notifies your landlord of repair issues
                via USPS Certified Mail®. This service is free and secure.
              </Trans>
            </ResponsiveElement>
            <CreateLetterCard />
          </div>
        </div>
      </section>
      <section className="jf-laletterbuilder-landing-section-secondary">
        <div className="hero-body">
          <div className="container">
            <h2 className="mb-7">
              <Trans>How it works</Trans>
            </h2>
            <div className="text-section">
              <ResponsiveElement className="mb-3" desktop="h4" touch="h3">
                <Trans>Build your letter</Trans>
              </ResponsiveElement>
              <label className="mb-6">
                <Trans>
                  Answer some basic questions about your housing situation, and
                  we’ll automatically create a letter for you.
                </Trans>
              </label>
            </div>
            <div className="text-section">
              <ResponsiveElement className="mb-3" desktop="h4" touch="h3">
                <Trans>Mail for free</Trans>
              </ResponsiveElement>
              <label className="mb-6">
                <Trans>
                  We’ll send your letter to your landlord or property manager
                  for free via certified mail. Or you can opt to print and mail
                  it yourself.
                </Trans>
              </label>
            </div>
            <div className="text-section">
              <ResponsiveElement className="mb-3" desktop="h4" touch="h3">
                <Trans>Next steps</Trans>
              </ResponsiveElement>
              <label>
                <Trans>
                  We’ll explain additional actions you can take if your issue
                  isn’t resolved.
                </Trans>
              </label>
            </div>
          </div>
        </div>
      </section>
      <section className="jf-laletterbuilder-landing-section-primary">
        <div className="hero-body">
          <div className="jf-accordion-list-large container">
            <h2 className="mb-7">
              <Trans>Frequently asked questions</Trans>
            </h2>
            {faqContent.map((el, i) => (
              <Accordion
                key={`faq-${i}`}
                question={el.question}
                questionClassName=""
                onClick={(isExpanded) =>
                  logEvent("ui.accordion.click", {
                    label: el.question,
                    isExpanded,
                  })
                }
              >
                {el.answer}
              </Accordion>
            ))}
            <StartLetterButton className="mt-5" />
          </div>
        </div>
      </section>
      <section className="jf-laletterbuilder-landing-section-tertiary">
        <div className="hero-body pb-8">
          <div className="container">
            <h2 className="mb-3">
              <Trans>Legally vetted</Trans>
            </h2>
            <h4 className="mb-6">
              <Trans>
                We created the LA Tenant Action Center with lawyers and
                non-profit tenant rights organizations to ensure that your
                letter gives you the most protections.
              </Trans>
            </h4>
            <div>
              <h2 className="mb-3">
                <Trans>Created by</Trans>
              </h2>
            </div>
            <div>
              <h4 className="mb-5">
                <Trans>
                  <OutboundLink href="https://www.justfix.org/">
                    JustFix
                  </OutboundLink>{" "}
                  builds tools for tenants, housing organizers, and legal
                  advocates.
                </Trans>
              </h4>
              <h4>
                <Trans>
                  <OutboundLink href="https://www.saje.net/">SAJE</OutboundLink>{" "}
                  empowers tenants in Los Angeles to fight for their homes and
                  communities.
                </Trans>
              </h4>
            </div>
          </div>
        </div>
      </section>
      <section className="jf-laletterbuilder-landing-section-secondary">
        <div className="hero-body">
          <div className="container">
            <h2 className="mb-7">
              <Trans>Tenant rights resources</Trans>
            </h2>
            <ResponsiveElement className="mb-3" desktop="h4" touch="h3">
              <Trans>Get involved in your community</Trans>
            </ResponsiveElement>
            <div className="text-section mb-7 mb-10-mobile">
              <label>
                <Trans>
                  Attend SAJE’s{" "}
                  <LocalizedOutboundLink
                    hrefs={{
                      en:
                        "https://www.saje.net/what-we-do/tenant-action-clinic/",
                      es:
                        "https://espanol.saje.net/que-hacemos/clinica-de-accion-de-inquilinos/",
                    }}
                  >
                    Tenant Action Clinic
                  </LocalizedOutboundLink>{" "}
                  if you're faced with a housing problem.
                  <br />
                  <br />
                  Get involved with SAJE to build power with your neighbors
                </Trans>
              </label>
            </div>
            <ResponsiveElement className="mb-3" desktop="h4" touch="h3">
              <Trans>Resources</Trans>
            </ResponsiveElement>
            <p className="mb-6">
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
};
