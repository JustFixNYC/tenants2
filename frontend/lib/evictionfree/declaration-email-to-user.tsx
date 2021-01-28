import React from "react";

import { asEmailStaticPage } from "../static-page/email-static-page";
import { HtmlEmail } from "../static-page/html-email";
import { TransformSession } from "../util/transform-session";
import {
  EvictionFreeDeclarationEmailProps,
  sessionToEvictionFreeDeclarationEmailProps,
} from "./declaration-email-utils";

const EmailBody: React.FC<EvictionFreeDeclarationEmailProps> = (props) => (
  <>
    <p>Hello {props.firstName},</p>
    <p>Congratulations!</p>
    <p>
      {/* TODO: Conditionalize this based on props! */}
      Your Hardship Declaration form has been emailed to your landlord and local
      housing court. A hard copy of your form has also been mailed to your
      landlord via USPS mail. A PDF of your form is attached to this email.
      Please save a copy for your records. You can also track the delivery of
      your hard copy form using USPS Tracking: {props.trackingNumber}.
    </p>
    <p>
      If you have received a Notice to Pay Rent or Quit or any other kind of
      eviction notice, contact Housing Court Answers (NYC) at 212-962-4795,
      Monday - Friday, 9am-5pm or the Statewide Hotline at 833-503-0447, open
      24/7.
    </p>
    <p>
      For more information about New York’s eviction protections and your rights
      as a tenant, check out our FAQ on the{" "}
      <a href="https://www.righttocounselnyc.org/">Right to Counsel website</a>.
    </p>
    <p>
      To get involved in organizing and the fight to #StopEvictions and
      #CancelRent, follow us on Twitter at{" "}
      <a href="https://twitter.com/RTCNYC">@RTCNYC</a> and{" "}
      <a href="https://twitter.com/housing4allNY">@housing4allNY</a>.
    </p>
  </>
);

export const EvictionFreeDeclarationEmailToUserBody: React.FC<{}> = () => (
  <TransformSession transformer={sessionToEvictionFreeDeclarationEmailProps}>
    {(bodyProps) => <EmailBody {...bodyProps} />}
  </TransformSession>
);

export const EvictionFreeDeclarationEmailToUserStaticPage = asEmailStaticPage(
  (props) => (
    <HtmlEmail subject="Your declaration form and important next steps">
      <EvictionFreeDeclarationEmailToUserBody />
    </HtmlEmail>
  )
);
