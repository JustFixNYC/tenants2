import React from "react";

import { AllSessionInfo } from "../queries/AllSessionInfo";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { HtmlEmail } from "../static-page/html-email";
import { TransformSession } from "../util/transform-session";

type EmailBodyProps = {
  firstName: string;
  trackingNumber?: string;
  wasEmailedToLandlord: boolean;
  wasMailedToLandlord: boolean;
};

function transformSession(s: AllSessionInfo): EmailBodyProps | null {
  const shd = s.submittedHardshipDeclaration;

  if (!(shd && s.firstName)) return null;

  return {
    firstName: s.firstName,
    trackingNumber: shd.trackingNumber,
    wasEmailedToLandlord: !!shd.emailedAt,
    wasMailedToLandlord: !!shd.mailedAt,
  };
}

const EmailBody: React.FC<EmailBodyProps> = (props) => (
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
  <TransformSession transformer={transformSession}>
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
