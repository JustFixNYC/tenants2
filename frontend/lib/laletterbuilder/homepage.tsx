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
import { faqContent } from "./faq-content";
import { ClickableLogo } from "./components/clickable-logo";
import { Link } from "react-router-dom";
import { bulmaClasses } from "../ui/bulma";

type LaLetterBuilderImageType = "png" | "svg";

export function getLaLetterBuilderImageSrc(
  name: string,
  type?: LaLetterBuilderImageType
) {
  return `frontend/img/laletterbuilder/${name}.${type || "svg"}`;
}

export const LaLetterBuilderHomepage: React.FC<{}> = () => {
  const { session } = useContext(AppContext);

  return (
    <Page title={li18n._(t`LA Letter Builder Homepage`)}>
      <section className="hero jf-laletterbuilder-landing-section-primary">
        <div className="hero-body">
          <div className="container">
            <h1>
              <Trans>
                As a California resident, you have a right to safe housing
              </Trans>
            </h1>
            <br />
            <h3>
              <Trans>
                Exercise your tenant rights. Send a free letter to your landlord
                in minutes.
              </Trans>
            </h3>
            <br />
            {!!session.phoneNumber ? (
              <>
                <Link
                  className={bulmaClasses("button", "is-primary", "is-large")}
                  to={LaLetterBuilderRouteInfo.locale.habitability.myLetters}
                >
                  <Trans>My letters</Trans>
                </Link>
                <br />
                <br />
                <Link
                  className={`${bulmaClasses(
                    "button",
                    "is-large"
                  )}  is-secondary`}
                  to={Routes.locale.chooseLetter}
                >
                  <Trans>Create a new letter</Trans>
                </Link>
              </>
            ) : (
              <Link
                className={bulmaClasses("button", "is-primary", "is-large")}
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
            <h2>
              <Trans>Legally vetted</Trans>
            </h2>
            <br />
            <h3>
              <Trans>
                We created the [Product Name] with lawyers and non-profit tenant
                rights organizations to ensure that your letter gives you the
                most protections.
              </Trans>
            </h3>
            <br />
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
            <h2>
              <Trans>How it works</Trans>
            </h2>
            <div className="text-section">
              <h3>
                <Trans>Build your letter</Trans>
              </h3>
              <label>
                <Trans>
                  Answer some basic questions about your housing situation, and
                  we’ll automatically create a letter for you.
                </Trans>
              </label>
            </div>
            <div className="text-section">
              <h3>
                <Trans>Mail for free</Trans>
              </h3>
              <label>
                <Trans>
                  We’ll send your letter to your landlord or property manager
                  for free via certified mail. Or you can opt to print and mail
                  it yourself.
                </Trans>
              </label>
            </div>
            <div className="text-section">
              <h3>
                <Trans>Next steps</Trans>
              </h3>
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
                questionClassName=""
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

            <h3>
              <Trans>Get involved in your community</Trans>
            </h3>
            <div className="text-section">
              <label>
                <Trans>
                  Attend SAJE’s{" "}
                  <OutboundLink href="https://www.saje.net/what-we-do/tenant-action-clinic/">
                    Tenant Action Clinic
                  </OutboundLink>{" "}
                  if you're faced with a housing problem.
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
            <h3>
              <Trans>Resources</Trans>
            </h3>
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
};
