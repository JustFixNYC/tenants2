import React from "react";

import { NorentRoutes } from "../route-info";
import { NorentNotSentLetterStep } from "./step-decorators";
import { Trans } from "@lingui/macro";
import LandlordMailingAddress from "../../common-steps/landlord-mailing-address";

const NorentLandlordMailingAddress = NorentNotSentLetterStep((props) => (
  <LandlordMailingAddress
    {...props}
    confirmModalRoute={NorentRoutes.locale.letter.landlordAddressConfirmModal}
  >
    <p>
      <Trans>We'll use this information to send your letter.</Trans>
    </p>
  </LandlordMailingAddress>
));

export default NorentLandlordMailingAddress;
