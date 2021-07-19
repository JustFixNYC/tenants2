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
  const rh = s.onboardingScaffolding;

  if (!rh) return null;

  if (
    !(
      rh.aptNumber &&
      rh.firstName &&
      rh.lastName &&
      rh.borough &&
      rh.street &&
      rh.zipCode
    )
  ) {
    return null;
  }

  const fullLegalName = `${rh.firstName} ${rh.lastName}`;
  const borough = getBoroughChoiceLabels()[rh.borough as BoroughChoice];
  const fullAddress = `${rh.street}, ${borough} ${rh.zipCode}`.trim();

  return { fullLegalName, fullAddress, apartmentNumber: rh.aptNumber };
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
              I, {i.fullLegalName}, am currently living at {i.fullAddress} in
              apartment {i.apartmentNumber}, and would like to request the
              complete Rent History for this apartment back to the year 1984.
            </p>
            <p>
              Thank you,
              <br />
              {i.fullLegalName}
            </p>
          </Trans>
        </>
      )}
    </TransformSession>
  );
};

export const RhEmailToDhcrStaticPage = asEmailStaticPage(RhEmailToDhcr);
