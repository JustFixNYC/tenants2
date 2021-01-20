import React from "react";
import { NorentNotSentLetterStep } from "./step-decorators";
import { LandlordNameAndContactTypes } from "../../common-steps/landlord-name-and-contact-types";
import { Trans } from "@lingui/macro";

export const NorentLandlordNameAndContactTypes = NorentNotSentLetterStep(
  (props) => (
    <LandlordNameAndContactTypes {...props}>
      <p>
        <Trans>We'll use this information to send your letter.</Trans>
      </p>
    </LandlordNameAndContactTypes>
  )
);
