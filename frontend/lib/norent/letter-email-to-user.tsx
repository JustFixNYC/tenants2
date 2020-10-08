import React from "react";

import { useContext } from "react";
import { AppContext } from "../app-context";
import {
  EmailSubject,
  asEmailStaticPage,
} from "../static-page/email-static-page";
import { NorentRoutes } from "./routes";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import { USPS_TRACKING_URL_PREFIX } from "../../../common-data/loc.json";

export const NorentLetterEmailToUser: React.FC<{}> = () => {
  const { session, server } = useContext(AppContext);
  const letter = session.norentLatestLetter;
  const faqURL = `${server.originURL}${NorentRoutes.locale.faqs}`;

  return (
    <>
      <EmailSubject value={li18n._(t`Here's a copy of your NoRent letter`)} />
      <Trans>
        <p>Hello {session.firstName},</p>
        <p>
          You've sent your NoRent letter. Attached to this email is a PDF copy
          for your records.
        </p>
      </Trans>
      {letter?.trackingNumber && <p>
        <Trans>
          You can also track the delivery of your letter using USPS Tracking:
      </Trans>{" "}
        {USPS_TRACKING_URL_PREFIX + letter.trackingNumber}
      </p>}
      <p>
        <Trans>
          To learn more about what to do next, check out our FAQ page: {faqURL}
        </Trans>
      </p>
    </>
  );
};

export const NorentLetterEmailToUserStaticPage = asEmailStaticPage(
  NorentLetterEmailToUser
);
