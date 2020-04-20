import {
  ProgressRoutesProps,
  buildProgressRoutesComponent,
} from "../../progress/progress-routes";
import { NorentRoutes } from "../routes";
import { NorentLandlordInfoPage } from "./landlord-info-page";
import { NorentLetterPreviewPage } from "./letter-preview";
import { createStartAccountOrLoginSteps } from "../start-account-or-login/steps";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { NorentLetterBuilderRouteInfo } from "./routes";
import { NorentLbWelcome } from "./welcome";
import { NorentLbAskName } from "./ask-name";
import { NorentLbAskCityState } from "./ask-city-state";
import { NorentLbAskEmail } from "./ask-email";
import { NorentLbAskNationalAddress } from "./ask-national-address";
import { NorentLbAskNycAddress } from "./ask-nyc-address";

function getLetterBuilderRoutes(): NorentLetterBuilderRouteInfo {
  return NorentRoutes.locale.letter;
}

function isUserInNYC(s: AllSessionInfo): boolean {
  return s.norentScaffolding?.isCityInNyc || false;
}

function isUserOutsideNYC(s: AllSessionInfo): boolean {
  return !isUserInNYC(s);
}

export const getNoRentLetterBuilderProgressRoutesProps = (): ProgressRoutesProps => {
  const routes = getLetterBuilderRoutes();

  return {
    toLatestStep: NorentRoutes.locale.letter.latestStep,
    label: "Build your letter",
    welcomeSteps: [],
    stepsToFillOut: [
      {
        path: routes.welcome,
        exact: true,
        component: NorentLbWelcome,
      },
      ...createStartAccountOrLoginSteps({
        routes,
        toPreviousPhase: routes.welcome,
        toNextPhase: routes.name,
      }),
      {
        path: routes.name,
        exact: true,
        component: NorentLbAskName,
      },
      {
        path: routes.city,
        exact: true,
        component: NorentLbAskCityState,
      },
      {
        path: routes.nationalAddress,
        exact: true,
        shouldBeSkipped: isUserInNYC,
        component: NorentLbAskNationalAddress,
      },
      {
        path: routes.nycAddress,
        exact: false,
        shouldBeSkipped: isUserOutsideNYC,
        component: NorentLbAskNycAddress,
      },
      {
        path: routes.email,
        exact: true,
        component: NorentLbAskEmail,
      },

      {
        path: NorentRoutes.locale.letter.landlordInfo,
        exact: true,
        component: NorentLandlordInfoPage,
      },
      {
        path: NorentRoutes.locale.letter.preview,
        exact: true,
        component: NorentLetterPreviewPage,
      },
    ],
    confirmationSteps: [],
  };
};

export const NorentLetterBuilderRoutes = buildProgressRoutesComponent(
  getNoRentLetterBuilderProgressRoutesProps
);
