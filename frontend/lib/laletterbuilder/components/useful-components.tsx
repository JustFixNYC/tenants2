import React from "react";

import { AskCityState } from "../../common-steps/ask-city-state";
import { AskNameStep } from "../../common-steps/ask-name";
import { AskNationalAddress } from "../../common-steps/ask-national-address";
import { LaLetterBuilderRouteInfo } from "../route-info";
import { LaLetterBuilderOnboardingStep } from "../letter-builder/step-decorators";
import { LandlordEmail } from "../../common-steps/landlord-email";
import LandlordMailingAddress from "../../common-steps/landlord-mailing-address";
import { LandlordNameAndContactTypes } from "../../common-steps/landlord-name-and-contact-types";
import { MiddleProgressStep } from "../../progress/progress-step-route";

export const LaLetterBuilderAskName = LaLetterBuilderOnboardingStep(
  AskNameStep
);
export const LaLetterBuilderAskCityState = LaLetterBuilderOnboardingStep(
  (props) => (
    <AskCityState
      {...props}
      confirmModalRoute={
        LaLetterBuilderRouteInfo.locale.habitability.cityConfirmModal // pass in this as a prop instead
      }
    >
      <p>must be California</p>
    </AskCityState>
  )
);
export const LaLetterBuilderAskNationalAddress = LaLetterBuilderOnboardingStep(
  (props) => (
    <AskNationalAddress
      {...props}
      routes={LaLetterBuilderRouteInfo.locale.habitability}
    >
      <p>TODO: Add content here.</p>
    </AskNationalAddress>
  )
);

export const LaLetterBuilderLandlordNameAndContactTypes = MiddleProgressStep(
  (props) => (
    <LandlordNameAndContactTypes {...props}>
      <p>TODO: Add content here.</p>
    </LandlordNameAndContactTypes>
  )
);
export const LaLetterBuilderLandlordEmail = MiddleProgressStep((props) => (
  <LandlordEmail {...props} introText="TODO: Add content here." />
));

export const LaLetterBuilderLandlordMailingAddress = MiddleProgressStep(
  (props) => (
    <LandlordMailingAddress
      {...props}
      confirmModalRoute={
        LaLetterBuilderRouteInfo.locale.habitability.landlordAddressConfirmModal
      }
    >
      <p>TODO: Add content here.</p>
    </LandlordMailingAddress>
  )
);
