import React from "react";
import { NorentRoutes } from "../route-info";
import { useIsOnboardingUserInStateWithProtections } from "./national-metadata";
import { NorentOnboardingStep } from "./step-decorators";
import { Trans } from "@lingui/macro";
import { AskNationalAddress } from "../../common-steps/ask-national-address";

export const NorentLbAskNationalAddress = NorentOnboardingStep((props) => {
  const isWritingLetter = useIsOnboardingUserInStateWithProtections();

  return (
    <AskNationalAddress {...props} routes={NorentRoutes.locale.letter}>
      {isWritingLetter ? (
        <p>
          <Trans>
            We'll include this information in the letter to your landlord.
          </Trans>
        </p>
      ) : (
        <p>
          <Trans>
            We’ll use this to reference the latest policies that protect your
            rights as a tenant.
          </Trans>
        </p>
      )}
    </AskNationalAddress>
  );
});
