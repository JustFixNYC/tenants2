import {
  buildProgressRoutesComponent,
  ProgressRoutesProps,
} from "../../progress/progress-routes";
import { createStartAccountOrLoginSteps } from "../../start-account-or-login/routes";
import { EvictionFreeRoutes } from "../route-info";
import { EvictionFreeDbConfirmation } from "./confirmation";
import { EvictionFreeDbWelcome } from "./welcome";

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
    stepsToFillOut: [],
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
