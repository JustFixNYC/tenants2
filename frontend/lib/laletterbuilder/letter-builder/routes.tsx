import {
  buildProgressRoutesComponent,
  ProgressRoutesProps,
} from "../../progress/progress-routes";
import { createStartAccountOrLoginSteps } from "../../start-account-or-login/routes";
import { LALetterBuilderRoutes } from "../route-info";
import { LALetterBuilderConfirmation } from "./confirmation";
import { LALetterBuilderWelcome } from "./welcome";
import { AskNameStep } from "../../common-steps/ask-name";
import { skipStepsIf } from "../../progress/skip-steps-if";
import { isUserLoggedIn } from "../../util/session-predicates";
import { LALetterBuilderOnboardingStep } from "./step-decorators";

const LALetterBuilderAskName = LALetterBuilderOnboardingStep(AskNameStep);

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
