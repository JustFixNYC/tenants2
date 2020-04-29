import React from "react";
import { Modal, BackOrUpOneDirLevel } from "./modal";
import { OutboundLink } from "../analytics/google-analytics";
import { Link } from "react-router-dom";

export const addNorentSuffixToUrl = (url: string) => url + "-norent";

export const DEFAULT_PRIVACY_POLICY_URL =
  "https://www.justfix.nyc/privacy-policy";
export const DEFAULT_TERMS_OF_USE_URL = "https://www.justfix.nyc/terms-of-use";

export function PrivacyInfoModal(props: {
  isForNorentSite?: boolean;
}): JSX.Element {
  return (
    <Modal
      title="Your privacy is very important to us!"
      onCloseGoTo={BackOrUpOneDirLevel}
      render={(ctx) => (
        <>
          <div className="jf-is-scrollable-if-too-tall">
            <h5>
              Your privacy is very important to us! Here are some important
              things to know:
            </h5>
            <ul>
              <li>Your personal information is secure.</li>
              <li>
                We don’t use your personal information for profit or sell it to
                third parties.
              </li>
              <li>
                We use your address to find information about your landlord and
                your building.
              </li>
            </ul>
            <p>
              Our Privacy Policy enables sharing anonymized data with approved
              tenant advocacy organizations exclusively to help further our
              tenants rights mission. The Privacy Policy contains information
              regarding what data we collect, how we use it, and the choices you
              have regarding your personal information. If you’d like to read{" "}
              more, please review our full{" "}
              <OutboundLink
                href={
                  props.isForNorentSite
                    ? addNorentSuffixToUrl(DEFAULT_PRIVACY_POLICY_URL)
                    : DEFAULT_PRIVACY_POLICY_URL
                }
                target="_blank"
              >
                Privacy Policy
              </OutboundLink>{" "}
              and{" "}
              <OutboundLink
                href={
                  props.isForNorentSite
                    ? addNorentSuffixToUrl(DEFAULT_TERMS_OF_USE_URL)
                    : DEFAULT_TERMS_OF_USE_URL
                }
                target="_blank"
              >
                Terms of Use
              </OutboundLink>
              .
            </p>
          </div>
          <div className="has-text-centered">
            <Link
              className="button is-primary is-medium"
              {...ctx.getLinkCloseProps()}
            >
              Got it!
            </Link>
          </div>
        </>
      )}
    />
  );
}
