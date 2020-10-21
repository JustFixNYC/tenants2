import React from "react";
import { PrivacyPolicyLink, TermsOfUseLink } from "./privacy-info-modal";
import JustfixRoutes from "../justfix-routes";
import { ROUTE_PREFIX } from "../util/route-util";
import { Trans } from "@lingui/macro";
import { LegalDisclaimer } from "./legal-disclaimer";
import { FooterLanguageToggle } from "./language-toggle";

const CreditForLHI = (props: { pathname?: string }) =>
  /* Include credit for LHI only on ehp routes */
  props.pathname?.startsWith(JustfixRoutes.locale.ehp[ROUTE_PREFIX]) ||
  props.pathname?.startsWith(JustfixRoutes.locale.hp[ROUTE_PREFIX]) ? (
    <p>
      <Trans>
        Developed with{" "}
        <a href="https://lawhelpinteractive.org/">Law Help Interactive</a>
      </Trans>
    </p>
  ) : null;

export const Footer = (props: { pathname?: string }) => {
  return (
    <footer>
      <div className="container">
        <div className="columns">
          <div className="column is-8">
            <div className="content">
              <LegalDisclaimer website="JustFix.nyc" />
              <p>
                <Trans>
                  JustFix.nyc is a registered 501(c)(3) nonprofit organization.
                </Trans>
              </p>
            </div>
          </div>
          <div className="column is-4 has-text-right content">
            <FooterLanguageToggle />
            <p>
              <Trans>
                Made with NYC ♥ by the team at{" "}
                <a href="https://justfix.nyc">JustFix.nyc</a>
              </Trans>
            </p>
            <CreditForLHI pathname={props.pathname} />
          </div>
        </div>
        <div className="columns">
          <div className="column is-8">
            <hr />
            <ul>
              <li>
                <PrivacyPolicyLink />
              </li>
              <li>
                <TermsOfUseLink />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
