import React from "react";
import { NorentRoutes } from "../route-info";
import { Trans } from "@lingui/macro";
import { NorentOnboardingStep } from "./step-decorators";
import { AskCityState } from "../../common-steps/ask-city-state";

export const NorentLbAskCityState = NorentOnboardingStep((props) => (
  <AskCityState
    {...props}
    confirmModalRoute={NorentRoutes.locale.letter.cityConfirmModal}
  >
    <p>
      <Trans>
        We’ll use this information to pull the most up-to-date ordinances that
        protect your rights as a tenant in your letter.
      </Trans>
    </p>
  </AskCityState>
));
