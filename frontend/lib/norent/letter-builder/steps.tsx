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
import { NorentLandlordEmail } from "./landlord-email";
import NorentLandlordMailingAddress from "./landlord-mailing-address";
import { NorentLbKnowYourRights } from "./know-your-rights";
import {
  isZipCodeInLosAngeles,
  isLoggedInUserInStateWithProtections,
} from "./national-metadata";
import { NorentLbLosAngelesRedirect } from "./la-address-redirect";
import { PostSignupNoProtections } from "./post-signup-no-protections";
import { hasNorentLetterBeenSentForThisRentPeriod } from "./step-decorators";

function getLetterBuilderRoutes(): NorentLetterBuilderRouteInfo {
  return NorentRoutes.locale.letter;
}

function isUserInNYC(s: AllSessionInfo): boolean {
  return s.norentScaffolding?.isCityInNyc || false;
}

function isUserOutsideNYC(s: AllSessionInfo): boolean {
  return !isUserInNYC(s);
}

function isUserLoggedInWithEmail(s: AllSessionInfo): boolean {
  return isUserLoggedIn(s) && !!s.email;
}

function isUserInLA(s: AllSessionInfo): boolean {
  const norent = s.norentScaffolding;
  if (!(norent && norent.zipCode)) return false;
  if (isUserInNYC(s)) return false;
  return isZipCodeInLosAngeles(norent.zipCode);
}

function isUserOutsideLA(s: AllSessionInfo): boolean {
  return !isUserInLA(s);
}

export const getNoRentLetterBuilderProgressRoutesProps = (): ProgressRoutesProps => {
  const routes = getLetterBuilderRoutes();

  return {
    toLatestStep: NorentRoutes.locale.letter.latestStep,
    welcomeSteps: [
      {
        path: routes.welcome,
        exact: true,
        component: NorentLbWelcome,
      },
      ...createStartAccountOrLoginSteps(routes),
    ],
    stepsToFillOut: [
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
          exact: false,
          component: NorentLbAskCityState,
        },
        {
          path: routes.knowYourRights,
          exact: true,
          component: NorentLbKnowYourRights,
        },
        {
          path: routes.nationalAddress,
          exact: false,
          shouldBeSkipped: isUserInNYC,
          component: NorentLbAskNationalAddress,
        },
        {
          path: routes.laAddress,
          exact: true,
          shouldBeSkipped: isUserOutsideLA,
          component: NorentLbLosAngelesRedirect,
        },
        {
          path: routes.nycAddress,
          exact: false,
          shouldBeSkipped: isUserOutsideNYC,
          component: NorentLbAskNycAddress,
        },
      ]),
      {
        path: routes.email,
        exact: true,
        component: NorentLbAskEmail,
        shouldBeSkipped: isUserLoggedInWithEmail,
      },
      {
        path: routes.createAccount,
        component: NorentCreateAccount,
        shouldBeSkipped: isUserLoggedIn,
      },
      {
        path: routes.postSignupNoProtections,
        exact: true,
        shouldBeSkipped: isLoggedInUserInStateWithProtections,
        component: PostSignupNoProtections,
      },
      {
        path: routes.landlordName,
        exact: true,
        component: NorentLandlordNameAndContactTypes,
      },
      {
        path: routes.landlordEmail,
        exact: true,
        shouldBeSkipped: (s) =>
          s.landlordDetails?.isLookedUp
            ? false
            : !s.norentScaffolding?.hasLandlordEmailAddress,
        component: NorentLandlordEmail,
      },
      {
        path: routes.landlordAddress,
        exact: false,
        shouldBeSkipped: (s) =>
          s.landlordDetails?.isLookedUp
            ? true
            : !s.norentScaffolding?.hasLandlordMailingAddress,
        component: NorentLandlordMailingAddress,
      },
      {
        path: routes.preview,
        exact: false,
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
