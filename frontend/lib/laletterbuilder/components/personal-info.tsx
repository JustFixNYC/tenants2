import React from "react";

import { AskCityState } from "../../common-steps/ask-city-state";
import { AskNameStep } from "../../common-steps/ask-name";
import { AskNationalAddress } from "../../common-steps/ask-national-address";
import { LaLetterBuilderRouteInfo } from "../route-info";
import { LaLetterBuilderOnboardingStep } from "../letter-builder/step-decorators";

export const LaLetterBuilderAskName = LaLetterBuilderOnboardingStep(
  AskNameStep
);
export const LaLetterBuilderAskCityState = LaLetterBuilderOnboardingStep(
  (props) => (
    <AskCityState
      {...props}
      forState="CA"
      confirmModalRoute={
        // pass in this as a prop instead to accommodate multiple letter types
        LaLetterBuilderRouteInfo.locale.habitability.cityConfirmModal
      }
    >
      <p>This tool is only for California residents.</p>
    </AskCityState>
  )
);
export const LaLetterBuilderAskNationalAddress = LaLetterBuilderOnboardingStep(
  (props) => (
    <AskNationalAddress
      {...props}
      routes={LaLetterBuilderRouteInfo.locale.habitability}
    >
      <p />
    </AskNationalAddress>
  )
);