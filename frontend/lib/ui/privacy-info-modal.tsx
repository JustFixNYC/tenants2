import React, { useContext } from "react";
import { Modal, BackOrUpOneDirLevel } from "./modal";
import { OutboundLink } from "./outbound-link";
import { Link } from "react-router-dom";
import { SiteChoice } from "../../../common-data/site-choices";
import { AppContext } from "../app-context";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";

export const DEFAULT_PRIVACY_POLICY_URL =
  "https://www.justfix.nyc/privacy-policy";
export const DEFAULT_TERMS_OF_USE_URL = "https://www.justfix.nyc/terms-of-use";

function getURLforSite(baseURL: string, site: SiteChoice): string {
  switch (site) {
    case "JUSTFIX":
      return baseURL;

    case "NORENT":
      return `${baseURL}-norent`;

    case "EVICTIONFREE":
      return `${baseURL}-eviction-free`;
  }
}

const LegalLink: React.FC<{ baseURL: string; text: string }> = (props) => {
  const { siteType } = useContext(AppContext).server;
  const url = getURLforSite(props.baseURL, siteType);

  return (
    <OutboundLink href={url} target="_blank">
      {props.text}
    </OutboundLink>
  );
};

export const PrivacyPolicyLink: React.FC<{ text?: string }> = ({ text }) => (
  <LegalLink
    baseURL={DEFAULT_PRIVACY_POLICY_URL}
    text={text || li18n._(t`Privacy Policy`)}
  />
);

export const TermsOfUseLink: React.FC<{ text?: string }> = ({ text }) => (
  <LegalLink
    baseURL={DEFAULT_TERMS_OF_USE_URL}
    text={text || li18n._(t`Terms of Use`)}
  />
);

export function PrivacyInfoModal(props: {}): JSX.Element {
  return (
    <Modal
      title={li18n._(t`Your privacy is very important to us!`)}
      onCloseGoTo={BackOrUpOneDirLevel}
      render={(ctx) => (
        <>
          <div className="jf-is-scrollable-if-too-tall">
            <Trans id="justfix.privacyInfoModalText">
              <h5>
                Your privacy is very important to us! Here are some important
                things to know:
              </h5>
              <ul>
                <li>Your personal information is secure.</li>
                <li>
                  We don’t use your personal information for profit or sell it
                  to third parties.
                </li>
                <li>
                  We use your address to find information about your landlord
                  and your building.
                </li>
              </ul>
              <p>
                Our Privacy Policy enables sharing anonymized data with approved
                tenant advocacy organizations exclusively to help further our
                tenants rights mission. The Privacy Policy contains information
                regarding what data we collect, how we use it, and the choices
                you have regarding your personal information. If you’d like to
                read more, please review our full <PrivacyPolicyLink /> and{" "}
                <TermsOfUseLink />.
              </p>
            </Trans>
          </div>
          <div className="has-text-centered">
            <Link
              className="button is-primary is-medium"
              {...ctx.getLinkCloseProps()}
            >
              <Trans>Got it!</Trans>
            </Link>
          </div>
        </>
      )}
    />
  );
}
