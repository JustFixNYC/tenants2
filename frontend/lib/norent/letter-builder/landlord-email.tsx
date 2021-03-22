import React from "react";
import { NorentNotSentLetterStep } from "./step-decorators";
import { Trans } from "@lingui/macro";
import { LandlordEmail } from "../../common-steps/landlord-email";

export const NorentLandlordEmail = NorentNotSentLetterStep((props) => (
  <LandlordEmail
    {...props}
    introText={<Trans>We'll use this information to send your letter.</Trans>}
  />
));
