import {
  ProgressRoutesProps,
  buildProgressRoutesComponent,
} from "../../progress/progress-routes";
import { NorentRoutes } from "../routes";
import { NorentLandlordNameAndContactTypes } from "./landlord-name-and-contact-types";
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
import { ProgressStepRoute } from "../../progress/progress-step-route";
import { isUserLoggedIn } from "../../util/session-predicates";
import { NorentCreateAccount } from "./create-account";
import { NorentConfirmation } from "./confirmation";

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
    welcomeSteps: [],
    stepsToFillOut: [
      {
        path: routes.welcome,
        exact: true,
        component: NorentLbWelcome,
      },
      ...createStartAccountOrLoginSteps(routes),

      // TODO: We're going to skip these steps if the user is logged-in for now,
      // which assumes that all our users have all the information we need,
      // which isn't necessarily the case.  Eventually we'll iron out the
      // edge cases.
      ...skipStepsIf(isUserLoggedIn, [
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
      ]),

      {
        path: routes.createAccount,
        component: NorentCreateAccount,
        shouldBeSkipped: isUserLoggedIn,
      },
      {
        path: routes.landlordInfo,
        exact: true,
        component: NorentLandlordNameAndContactTypes,
      },
      {
        path: routes.preview,
        exact: true,
        isComplete: hasNorentLetterBeenSentForThisRentPeriod,
        component: NorentLetterPreviewPage,
      },
    ],
    confirmationSteps: [
      {
        path: routes.confirmation,
        exact: true,
        component: NorentConfirmation,
      },
    ],
  };
};

export const NorentLetterBuilderRoutes = buildProgressRoutesComponent(
  getNoRentLetterBuilderProgressRoutesProps
);

function skipStepsIf(
  predicate: (s: AllSessionInfo) => boolean,
  steps: ProgressStepRoute[]
): ProgressStepRoute[] {
  return steps.map((step) => {
    return {
      ...step,
      shouldBeSkipped(s) {
        if (predicate(s)) return true;
        if (step.shouldBeSkipped) return step.shouldBeSkipped(s);
        return false;
      },
    };
  });
}

function hasNorentLetterBeenSentForThisRentPeriod(s: AllSessionInfo): boolean {
  const letter = s.norentLatestLetter;
  const rentPeriod = s.norentLatestRentPeriod;
  if (!(letter && rentPeriod)) return false;
  return letter.paymentDate === rentPeriod.paymentDate && !!letter.letterSentAt;
}
