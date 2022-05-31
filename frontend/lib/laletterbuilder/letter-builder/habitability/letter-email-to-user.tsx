import React from "react";

import { asEmailStaticPage } from "../../../static-page/email-static-page";
import { li18n } from "../../../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import { USPS_TRACKING_URL_PREFIX } from "../../../../../common-data/loc";
import { HtmlEmail } from "../../../static-page/html-email";
import { TransformSession } from "../../../util/transform-session";
import { AllSessionInfo } from "../../../queries/AllSessionInfo";

type EmailBodyProps = {
  firstName: string;
  trackingNumber?: string;
  isInLosAngeles: boolean;
};

const EmailBody: React.FC<EmailBodyProps> = (props) => (
  <>
    <Trans>
      <p>Hello {props.firstName},</p>
      <p>
        You've sent your Notice To Repair letter. Attached to this email is a
        PDF copy for your records.
      </p>
    </Trans>
    {props.trackingNumber && (
      <p>
        <Trans>
          You can also track the delivery of your letter using USPS Tracking:
        </Trans>{" "}
        <a
          data-jf-show-href-only-in-plaintext
          href={USPS_TRACKING_URL_PREFIX + props.trackingNumber}
        >
          {props.trackingNumber}
        </a>
      </p>
    )}
    {props.isInLosAngeles ? (
      <>
        <p>
          <Trans>
            You can contact Strategic Actions for a Just Economy (SAJE) - a
            501c3 non-profit organization in South Los Angeles.
          </Trans>
        </p>
        <blockquote>
          <em>
            <Trans id="norent.sajeBlockQuote">
              Since 1996 SAJE has been a force for economic justice in our
              community focusing on tenant rights, healthy housing, and
              equitable development. SAJE believes that the fate of city
              neighborhoods should be decided by those who dwell there, and
              convenes with other organizations to ensure this occurs in a
              manner that is fair, replicable, and sustainable. Housing is a
              human right.
            </Trans>
          </em>
        </blockquote>
        <p>
          <strong>
            <Trans id="norent.sajePhoneCalls">
              Strategic Actions for a Just Economy (SAJE) is available for phone
              calls at (213) 745-9961, Monday-Friday from 10:00am-6:00pm.
            </Trans>
          </strong>
        </p>
      </>
    ) : (
      <></>
    )}
  </>
);

export const HabitabilityLetterEmailToUserBody: React.FC<{}> = () => {
  return (
    <TransformSession
      transformer={(session: AllSessionInfo): EmailBodyProps | null => {
        const { firstName, onboardingInfo } = session;
        if (!(onboardingInfo && firstName)) return null;
        return {
          trackingNumber: session.habitabilityLatestLetter?.trackingNumber,
          isInLosAngeles: !!onboardingInfo.isInLosAngeles,
          firstName,
        };
      }}
    >
      {(bodyProps) => <EmailBody {...bodyProps} />}
    </TransformSession>
  );
};

export const HabitabilityLetterEmailToUserStaticPage = asEmailStaticPage(
  (props) => (
    <HtmlEmail
      subject={li18n._(
        t`Your Notice to Repair letter and important next steps`
      )}
    >
      <HabitabilityLetterEmailToUserBody />
    </HtmlEmail>
  )
);
