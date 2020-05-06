import React from "react";
import { PrivacyPolicyLink, TermsOfUseLink } from "./privacy-info-modal";
import Routes from "../routes";

const getRoutesWithCreditForLHI = () => Object.values(Routes.locale.ehp);

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
            {props.pathname &&
              getRoutesWithCreditForLHI().includes(props.pathname) && (
                <p>
                  Developed with{" "}
                  <a href="https://justfix.nyc">Law Help Interactive</a>
                </p>
              )}
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
