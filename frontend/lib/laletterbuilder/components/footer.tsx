import { Trans } from "@lingui/macro";
import React from "react";

import { ClickableLogo } from "./clickable-logo";
import { FooterLanguageToggle } from "../../ui/language-toggle";
import { LegalDisclaimer } from "../../ui/legal-disclaimer";
import { LocalizedOutboundLink } from "../../ui/localized-outbound-link";
import { OutboundLink } from "../../ui/outbound-link";
import { PhoneNumber } from "./phone-number";

export const LaLetterBuilderFooter: React.FC<{}> = () => (
  <>
    <section className="jf-laletterbuilder-footer-section">
      <div>
        <h2 className="mb-3">
          <Trans>Support</Trans>
        </h2>
        <label>
          <Trans>
            Contact SAJE at <PhoneNumber number="(213) 745-9961" /> or attend
            the{" "}
            <OutboundLink href="https://www.saje.net/what-we-do/tenant-action-clinic/">
              Tenant Action Clinic
            </OutboundLink>
          </Trans>
        </label>
      </div>
    </section>
    <footer className="has-background-dark">
      <div className="container">
        <div className="content pb-9">
          <FooterLanguageToggle />
          <div className="columns mt-6 mb-0">
            {/* TODO: change this to match our final URL decision */}
            <div className="column is-6">
              <LegalDisclaimer
                website="latenants.justfix.org"
                className="is-small"
              />
            </div>
            <div className="column is-6">
              <ClickableLogo
                imageClassName="jf-laletterbuilder-footer-logo"
                imageUrl="justfix-saje-combined-logo"
              />
              <p className="is-small">
                <Trans>
                  JustFix and SAJE are registered 501(c)(3) nonprofit
                  organizations.
                </Trans>
              </p>
            </div>
          </div>
          <br />
          <div className="is-divider"></div>
          <span className="is-uppercase">
            <LocalizedOutboundLink
              hrefs={{
                en: "https://www.justfix.org/en/privacy-policy",
                es: "https://www.justfix.org/es/privacy-policy",
              }}
            >
              <Trans>Privacy Policy</Trans>
            </LocalizedOutboundLink>
          </span>
          <span className="is-pulled-right is-uppercase">
            <LocalizedOutboundLink
              hrefs={{
                en: "https://www.justfix.org/en/terms-of-use/",
                es: "https://www.justfix.org/es/terms-of-use/",
              }}
            >
              <Trans>Terms of Use</Trans>
            </LocalizedOutboundLink>
          </span>
        </div>
      </div>
    </footer>
  </>
);
