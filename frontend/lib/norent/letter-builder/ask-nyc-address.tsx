import React from "react";
import { NorentRoutes } from "../route-info";
import { NorentOnboardingStep } from "./step-decorators";
import { AskNycAddress } from "../../common-steps/ask-nyc-address";
import { Trans } from "@lingui/macro";

export const NorentLbAskNycAddress = NorentOnboardingStep((props) => {
  return (
    <AskNycAddress
      {...props}
      confirmModalRoute={NorentRoutes.locale.letter.nycAddressConfirmModal}
    >
      <p>
        <Trans>
          We'll include this information in the letter to your landlord.
        </Trans>
      </p>
    </AskNycAddress>
  );
});
