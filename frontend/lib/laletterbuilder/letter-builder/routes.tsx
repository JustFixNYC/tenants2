import { AskNameStep } from "../../common-steps/ask-name";
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
