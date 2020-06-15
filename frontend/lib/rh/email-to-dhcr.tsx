import React from "react";

import { useContext } from "react";
import { AppContext } from "../app-context";
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

export const RhEmailToDhcr: React.FC<{}> = () => {
  const rh = useContext(AppContext).session.rentalHistoryInfo;

  if (!rh) {
    return <p>We do not have enough information to create an email to DHCR.</p>;
  }

  const fullName = `${rh.firstName} ${rh.lastName}`;
  const borough = getBoroughChoiceLabels()[rh.borough as BoroughChoice];
  const fullAddress = `${rh.address}, ${borough} ${rh.zipcode}`.trim();

  return (
    <>
      <EmailSubject value={li18n._(t`Request for Rent History`)} />

      <Trans id="justfix.rhRequestToDhcr">
        <p>DHCR administrator,</p>
        <p>
          I, {fullName}, am currently living at {fullAddress} in apartment{" "}
          {rh.apartmentNumber}, and would like to request the complete Rent
          History for this apartment back to the year 1984.
        </p>
        <p>
          Thank you,
          <br />
          {fullName}
        </p>
      </Trans>
    </>
  );
};

export const RhEmailToDhcrStaticPage = asEmailStaticPage(RhEmailToDhcr);
