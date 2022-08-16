import React, { useContext } from "react";

import { t, Trans } from "@lingui/macro";

import Page from "../ui/page";

import { AppContext } from "../app-context";
import {
  LaLetterBuilderRouteInfo,
  LaLetterBuilderRouteInfo as Routes,
} from "./route-info";
import { Accordion } from "../ui/accordion";
import { li18n } from "../i18n-lingui";
import { OutboundLink } from "../ui/outbound-link";
import { getFaqContent } from "./faq-content";
import { ClickableLogo } from "./components/clickable-logo";
import { Link } from "react-router-dom";
import { bulmaClasses } from "../ui/bulma";
import ResponsiveElement from "./components/responsive-element";
import { logEvent } from "../analytics/util";
import { LocalizedOutboundLink } from "../ui/localized-outbound-link";

type LaLetterBuilderImageType = "png" | "svg";

export function getLaLetterBuilderImageSrc(
  name: string,
  type?: LaLetterBuilderImageType
) {
  return `frontend/img/laletterbuilder/${name}.${type || "svg"}`;
}

export const LaLetterBuilderHomepage: React.FC<{}> = () => {
  const { session } = useContext(AppContext);
  const faqContent = getFaqContent();

  return (
    <Page title={li18n._(t`LA Tenant Action Center`)}>
      <section className="hero jf-laletterbuilder-landing-section-primary">
        <div className="hero-body">
          <div className="container">
            <ResponsiveElement className="mb-5" desktop="h3" touch="h1">
              <Trans>
                As a California resident, you have a right to safe housing
              </Trans>
            </ResponsiveElement>
            <ResponsiveElement className="mb-7" desktop="h4" touch="h3">
              <Trans>
                Exercise your tenant rights. Send a free letter to your landlord
                in minutes.
              </Trans>
            </ResponsiveElement>
            {!!session.phoneNumber ? (
              <>
                <div>
                  <Link
                    className={`${bulmaClasses(
                      "button",
                      "is-primary",
                      "is-large"
                    )} mb-5`}
                    to={LaLetterBuilderRouteInfo.locale.habitability.myLetters}
                  >
                    <Trans>My letters</Trans>
                  </Link>
                </div>
                <div>
                  <Link
                    className={`${bulmaClasses(
                      "button",
                      "is-large"
                    )}  is-secondary`}
                    to={Routes.locale.chooseLetter}
                  >
                    <Trans>Create a new letter</Trans>
                  </Link>
                </div>
              </>
            ) : (
              <Link
                className={`${bulmaClasses(
                  "button",
                  "is-primary",
                  "is-large"
                )} mb-7`}
                to={Routes.locale.chooseLetter}
              >
                <Trans>View letters</Trans>
              </Link>
            )}
          </div>
        </div>
      </section>
      <section className="jf-laletterbuilder-landing-section-secondary">
        <div className="hero-body">
          <div className="container">
            <h2 className="mb-3">
              <Trans>Legally vetted</Trans>
            </h2>
            <ResponsiveElement className="mb-10" desktop="h4" touch="h3">
              <Trans>
                We created the LA Tenant Action Center with lawyers and
                non-profit tenant rights organizations to ensure that your
                letter gives you the most protections.
              </Trans>
            </ResponsiveElement>
            <div>
              <h2>
                <Trans>Created by</Trans>
              </h2>
              <ClickableLogo imageUrl="justfix-saje-combined-logo-black" />
            </div>
          </div>
        </div>
      </section>
      <section className="jf-laletterbuilder-landing-section-tertiary">
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
