import { t, Trans } from "@lingui/macro";
import React from "react";

import { USPS_TRACKING_URL_PREFIX } from "../../../common-data/loc.json";
import { li18n } from "../i18n-lingui";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { HtmlEmail } from "../static-page/html-email";
import { TransformSession } from "../util/transform-session";
import {
  EvictionFreeDeclarationEmailProps,
  sessionToEvictionFreeDeclarationEmailProps,
} from "./declaration-email-utils";

const EmailBody: React.FC<EvictionFreeDeclarationEmailProps> = (props) => {
  const emailRecipients: string[] = [];

  if (props.wasEmailedToHousingCourt) {
    emailRecipients.push(li18n._(t`Your local housing court`));
  }
  if (props.wasEmailedToLandlord) {
    emailRecipients.push(li18n._(t`Your landlord`));
  }

  return (
    <>
      <p>
        <Trans>Hello {props.firstName},</Trans>
      </p>
      <p>
        <Trans>Congratulations!</Trans>
      </p>
      {emailRecipients.length > 0 && (
        <>
          <p>
            <Trans>Your Hardship Declaration form has been emailed to:</Trans>
          </p>
          <ul>
            {emailRecipients.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </>
      )}
      {props.wasMailedToLandlord && (
        <p>
          <Trans>
            A hard copy of your form has also been mailed to your landlord via
            USPS mail. You can also track the delivery of your hard copy form
            using USPS Tracking:
          </Trans>{" "}
          <a
            data-jf-show-href-only-in-plaintext
            href={USPS_TRACKING_URL_PREFIX + props.trackingNumber}
          >
            {props.trackingNumber}
          </a>
        </p>
      )}
      <p>
        <Trans>
          A PDF of your form is attached to this email. Please save a copy for
          your records.
        </Trans>
      </p>
      <p>
        <Trans id="evictionfree.contactHcaBlurb">
          If you have received a Notice to Pay Rent or Quit or any other kind of
          eviction notice, contact Housing Court Answers (NYC) at 212-962-4795,
          Monday - Friday, 9am-5pm or the Statewide Hotline at 833-503-0447,
          open 24/7.
        </Trans>
      </p>
      <p>
        <Trans>
          For more information about New York’s eviction protections and your
          rights as a tenant, check out our FAQ on the{" "}
          <a href="https://www.righttocounselnyc.org/">
            Right to Counsel website
          </a>
          .
        </Trans>
      </p>
      <p>
        <Trans>
          To get involved in organizing and the fight to #StopEvictions and
          #CancelRent, follow us on Twitter at{" "}
          <a href="https://twitter.com/RTCNYC">@RTCNYC</a> and{" "}
          <a href="https://twitter.com/housing4allNY">@housing4allNY</a>.
        </Trans>
      </p>
    </>
  );
};

export const EvictionFreeDeclarationEmailToUserBody: React.FC<{}> = () => (
  <TransformSession transformer={sessionToEvictionFreeDeclarationEmailProps}>
    {(bodyProps) => <EmailBody {...bodyProps} />}
  </TransformSession>
);

export const EvictionFreeDeclarationEmailToUserStaticPage = asEmailStaticPage(
  (props) => (
    <HtmlEmail
      subject={li18n._(t`Your declaration form and important next steps`)}
    >
      <EvictionFreeDeclarationEmailToUserBody />
    </HtmlEmail>
  )
);
