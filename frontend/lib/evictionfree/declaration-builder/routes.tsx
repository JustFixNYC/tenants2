import React from "react";
import { AskCityState } from "../../common-steps/ask-city-state";
import { AskNameStep } from "../../common-steps/ask-name";
import { AskNationalAddress } from "../../common-steps/ask-national-address";
import {
  buildProgressRoutesComponent,
  ProgressRoutesProps,
} from "../../progress/progress-routes";
import { skipStepsIf } from "../../progress/skip-steps-if";
import { createStartAccountOrLoginSteps } from "../../start-account-or-login/routes";
import { isUserLoggedIn } from "../../util/session-predicates";
import { EvictionFreeRoutes } from "../route-info";
import { EvictionFreeDbConfirmation } from "./confirmation";
import { EvictionFreeOnboardingStep } from "./step-decorators";
import { EvictionFreeDbWelcome } from "./welcome";

const EfAskName = EvictionFreeOnboardingStep(AskNameStep);

const EfAskCityState = EvictionFreeOnboardingStep((props) => (
  <AskCityState
    {...props}
    confirmModalRoute={EvictionFreeRoutes.locale.declaration.cityConfirmModal}
  >
    <p>It's gotta be in New York.</p>
  </AskCityState>
));

const EfAskNationalAddress = EvictionFreeOnboardingStep((props) => (
  <AskNationalAddress {...props} routes={EvictionFreeRoutes.locale.declaration}>
    <p>TODO: Add content here.</p>
  </AskNationalAddress>
));

export const getEvictionFreeDeclarationBuilderProgressRoutesProps = (): ProgressRoutesProps => {
  const routes = EvictionFreeRoutes.locale.declaration;

  return {
    toLatestStep: routes.latestStep,
    welcomeSteps: [
      {
        path: routes.welcome,
        exact: true,
        component: EvictionFreeDbWelcome,
      },
      ...createStartAccountOrLoginSteps(routes),
    ],
    stepsToFillOut: [
      // TODO: Add cross-site "agree to terms" step.
      ...skipStepsIf(isUserLoggedIn, [
        {
          path: routes.name,
          exact: true,
          component: EfAskName,
        },
        {
          path: routes.city,
          exact: false,
          component: EfAskCityState,
        },
        {
          path: routes.nationalAddress,
          exact: false,
          // TODO: Uncomment the next line eventually.
          // shouldBeSkipped: isUserInNYC,
          component: EfAskNationalAddress,
        },
      ]),
    ],
    confirmationSteps: [
      {
        path: routes.confirmation,
        exact: true,
        component: EvictionFreeDbConfirmation,
      },
    ],
  };
};

export const EvictionFreeDeclarationBuilderRoutes = buildProgressRoutesComponent(
  getEvictionFreeDeclarationBuilderProgressRoutesProps
);
