import React from "react";
import { PrivacyPolicyLink, TermsOfUseLink } from "./privacy-info-modal";
import Routes from "../justfix-routes";
import { ROUTE_PREFIX } from "../util/route-util";

const CreditForLHI = (props: { pathname?: string }) =>
  /* Include credit for LHI only on ehp routes */
  props.pathname &&
  props.pathname.startsWith(Routes.locale.ehp[ROUTE_PREFIX]) ? (
    <p>
      Developed with{" "}
      <a href="https://lawhelpinteractive.org/">Law Help Interactive</a>
    </p>
  ) : (
    <></>
  );

export const Footer = (props: { pathname?: string }) => {
  return (
    <footer>
      <div className="container">
        <div className="columns">
          <div className="column is-8">
            <div className="content">
              <p>
                Disclaimer: The information in JustFix.nyc does not constitute
                legal advice and must not be used as a substitute for the advice
                of a lawyer qualified to give advice on legal issues pertaining
                to housing. We can help direct you to free legal services if
                necessary.
              </p>
              <p>
                JustFix.nyc is a registered 501(c)(3) nonprofit organization.
              </p>
            </div>
          </div>
          <div className="column is-4 has-text-right content">
            <p>
              Made with NYC ♥ by the team at{" "}
              <a href="https://justfix.nyc">JustFix.nyc</a>
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
