import React from "react";

import {
  EmailSubject,
  asEmailStaticPage,
} from "../static-page/email-static-page";
import {
  getBoroughChoiceLabels,
  BoroughChoice,
} from "../../../common-data/borough-choices";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";
import { TransformSession } from "../util/transform-session";
import { AllSessionInfo } from "../queries/AllSessionInfo";

function getEmailInfo(s: AllSessionInfo) {
  const rh = s.rentalHistoryInfo;

  if (!rh) return null;

  const { apartmentNumber } = rh;
  const fullName = `${rh.firstName} ${rh.lastName}`;
  const borough = getBoroughChoiceLabels()[rh.borough as BoroughChoice];
  const fullAddress = `${rh.address}, ${borough} ${rh.zipcode}`.trim();

  return { fullName, fullAddress, apartmentNumber };
}

export const RhEmailToDhcr: React.FC<{}> = () => {
  return (
    <TransformSession transformer={getEmailInfo}>
      {(i) => (
        <>
          <EmailSubject value={li18n._(t`Request for Rent History`)} />

          <Trans id="justfix.rhRequestToDhcr">
            <p>DHCR administrator,</p>
            <p>
              I, {i.fullName}, am currently living at {i.fullAddress} in
              apartment {i.apartmentNumber}, and would like to request the
              complete Rent History for this apartment back to the year 1984.
            </p>
            <p>
              Thank you,
              <br />
              {i.fullName}
            </p>
          </Trans>
        </>
      )}
    </TransformSession>
  );
};

export const RhEmailToDhcrStaticPage = asEmailStaticPage(RhEmailToDhcr);
