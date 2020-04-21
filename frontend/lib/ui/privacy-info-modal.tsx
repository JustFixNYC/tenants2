import React from "react";
import { Modal, BackOrUpOneDirLevel } from "./modal";
import { OutboundLink } from "../analytics/google-analytics";
import { Link } from "react-router-dom";

export function PrivacyInfoModal(): JSX.Element {
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
                href="https://www.justfix.nyc/privacy-policy"
                target="_blank"
              >
                Privacy Policy
              </OutboundLink>{" "}
              and{" "}
              <OutboundLink
                href="https://www.justfix.nyc/terms-of-use"
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
