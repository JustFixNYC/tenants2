import React from "react";
import { AskNameStep } from "../../common-steps/ask-name";
import { AskCityState } from "../../common-steps/ask-city-state";
import { AskNationalAddress } from "../../common-steps/ask-national-address";
import {
  ProgressRoutesProps,
  buildProgressRoutesComponent,
} from "../../progress/progress-routes";
import { skipStepsIf } from "../../progress/skip-steps-if";
import { createStartAccountOrLoginSteps } from "../../start-account-or-login/routes";
import { isUserLoggedIn } from "../../util/session-predicates";
import { LALetterBuilderRoutes } from "../route-info";
import { LALetterBuilderConfirmation } from "./confirmation";
import { LALetterBuilderOnboardingStep } from "./step-decorators";
import { LALetterBuilderWelcome } from "./welcome";

const LALetterBuilderAskName = LALetterBuilderOnboardingStep(AskNameStep);
const LALetterBuilderAskCityState = LALetterBuilderOnboardingStep((props) => (
  <AskCityState
    {...props}
    confirmModalRoute={LALetterBuilderRoutes.locale.letter.cityConfirmModal}
  >
    <p>must be California</p>
  </AskCityState>
));
const LALetterBuilderAskNationalAddress = LALetterBuilderOnboardingStep(
  (props) => (
    <AskNationalAddress {...props} routes={LALetterBuilderRoutes.locale.letter}>
      <p>TODO: Add content here.</p>
    </AskNationalAddress>
  )
);

export const getLALetterBuilderProgressRoutesProps = (): ProgressRoutesProps => {
  const routes = LALetterBuilderRoutes.locale.letter;

  return {
    toLatestStep: routes.latestStep,
    welcomeSteps: [
      {
        path: routes.welcome,
        exact: true,
        component: LALetterBuilderWelcome,
      },
      ...createStartAccountOrLoginSteps(routes),
    ],
    stepsToFillOut: [
      // TODO: Add cross-site "agree to terms" step.
      ...skipStepsIf(isUserLoggedIn, [
        {
          path: routes.name,
          exact: true,
          component: LALetterBuilderAskName,
        },
        {
          path: routes.city,
          exact: false,
          component: LALetterBuilderAskCityState,
        },
        {
          path: routes.nationalAddress,
          exact: false,
          // TODO: add something that short circuits if the user isn't in LA
          component: LALetterBuilderAskNationalAddress,
        },
      ]),
    ],
    confirmationSteps: [
      {
        path: routes.confirmation,
        exact: true,
        component: LALetterBuilderConfirmation,
      },
    ],
  };
};

export const LALetterBuilderFormsRoutes = buildProgressRoutesComponent(
  getLALetterBuilderProgressRoutesProps
);