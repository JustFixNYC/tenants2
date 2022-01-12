import React from "react";

import { AskCityState } from "../../common-steps/ask-city-state";
import { AskNameStep } from "../../common-steps/ask-name";
import { AskNationalAddress } from "../../common-steps/ask-national-address";
import {
  shouldSkipLandlordEmailStep,
  LandlordEmail,
} from "../../common-steps/landlord-email";
import LandlordMailingAddress, {
  shouldSkipLandlordMailingAddressStep,
} from "../../common-steps/landlord-mailing-address";
import { LandlordNameAndContactTypes } from "../../common-steps/landlord-name-and-contact-types";
import {
  ProgressRoutesProps,
  buildProgressRoutesComponent,
} from "../../progress/progress-routes";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { skipStepsIf } from "../../progress/skip-steps-if";
import { createStartAccountOrLoginSteps } from "../../start-account-or-login/routes";
import { isUserLoggedIn } from "../../util/session-predicates";
import { LaLetterBuilderRoutes } from "../route-info";
import { LaLetterBuilderChooseLetterStep } from "./choose-letters";
import { LaLetterBuilderLetterRecommendation } from "./letter-recommendation";
import { LaLetterBuilderCreateAccount } from "./create-account";
import { LaLetterBuilderOnboardingStep } from "./step-decorators";
import { LaLetterBuilderWelcome } from "./welcome";
//import { createHabitabilitySteps } from "./habitability/routes";

const LaLetterBuilderAskName = LaLetterBuilderOnboardingStep(AskNameStep);
const LaLetterBuilderAskCityState = LaLetterBuilderOnboardingStep((props) => (
  <AskCityState
    {...props}
    confirmModalRoute={LaLetterBuilderRoutes.locale.letter.cityConfirmModal}
  >
    <p>must be California</p>
  </AskCityState>
));
const LaLetterBuilderAskNationalAddress = LaLetterBuilderOnboardingStep(
  (props) => (
    <AskNationalAddress {...props} routes={LaLetterBuilderRoutes.locale.letter}>
      <p>TODO: Add content here.</p>
    </AskNationalAddress>
  )
);

export const getLaLetterBuilderOnboardingProgressRoutesProps = (): ProgressRoutesProps => {
  const routes = LaLetterBuilderRoutes.locale.letter;

  return {
    toLatestStep: routes.latestStep,
    welcomeSteps: [
      {
        path: routes.welcome,
        exact: true,
        component: LaLetterBuilderWelcome,
      },
      ...createStartAccountOrLoginSteps(routes),
    ],
    stepsToFillOut: [
      ...skipStepsIf(isUserLoggedIn, [
        {
          path: routes.name,
          exact: true,
          component: LaLetterBuilderAskName,
        },
        {
          path: routes.city,
          exact: false,
          component: LaLetterBuilderAskCityState,
        },
        {
          path: routes.nationalAddress,
          exact: false,
          // TODO: add something that short circuits if the user isn't in LA
          component: LaLetterBuilderAskNationalAddress,
        },
      ]),
      {
        path: routes.createAccount,
        component: LaLetterBuilderCreateAccount,
        shouldBeSkipped: isUserLoggedIn,
      },
      {
        path: routes.chooseLetter,
        exact: true,
        component: LaLetterBuilderChooseLetterStep,
      },
      //...createHabitabilitySteps(routes),
    ],
    confirmationSteps: [
      {
        path: routes.recommendation,
        exact: true,
        component: LaLetterBuilderLetterRecommendation,
      },
    ],
  };
};

export const LaLetterBuilderOnboardingRoutes = buildProgressRoutesComponent(
  getLaLetterBuilderOnboardingProgressRoutesProps
);
