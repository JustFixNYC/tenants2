import {
  ProgressRoutesProps,
  buildProgressRoutesComponent,
} from "../../progress/progress-routes";
import { NorentRoutes } from "../route-info";
import { NorentLandlordNameAndContactTypes } from "./landlord-name-and-contact-types";
import { NorentLetterPreviewPage } from "./letter-preview";
import { createStartAccountOrLoginSteps } from "../../start-account-or-login/routes";
import { NorentLetterBuilderRouteInfo } from "./route-info";
import { NorentLbWelcome } from "./welcome";
import { AskNameStep } from "../../common-steps/ask-name";
import { NorentLbAskCityState } from "./ask-city-state";
import { NorentLbAskEmail } from "./ask-email";
import { NorentLbAskNationalAddress } from "./ask-national-address";
import {
  isUserInNYC,
  isUserOutsideLA,
  isUserOutsideNYC,
} from "../../common-steps/ask-national-address";
import { NorentLbAskNycAddress } from "./ask-nyc-address";
import {
  isUserLoggedIn,
  isUserLoggedInWithEmail,
} from "../../util/session-predicates";
import { NorentCreateAccount } from "./create-account";
import { NorentConfirmation } from "./confirmation";
import { NorentLandlordEmail } from "./landlord-email";
import NorentLandlordMailingAddress from "./landlord-mailing-address";
import {
  NorentLbKnowYourRights,
  hasUserSeenRttcCheckboxYet,
} from "./know-your-rights";
import { isLoggedInUserInStateWithProtections } from "./national-metadata";
import {
  hasUserSeenSajeCheckboxYet,
  NorentLbLosAngelesKyr,
} from "./los-angeles-know-your-rights";
import { PostSignupNoProtections } from "./post-signup-no-protections";
import { createCrossSiteAgreeToTermsStep } from "../../pages/cross-site-terms-opt-in";
import { NorentRentPeriods, NorentRentPeriodsWithModal } from "./rent-periods";
import {
  hasNorentLetterBeenSentForAllRentPeriods,
  hasNorentLetterNeverBeenSent,
  NorentOnboardingStep,
} from "./step-decorators";
import { NorentMenu } from "./menu";
import { skipStepsIf } from "../../progress/skip-steps-if";
import { shouldSkipLandlordEmailStep } from "../../common-steps/landlord-email";
import { shouldSkipLandlordMailingAddressStep } from "../../common-steps/landlord-mailing-address";

function getLetterBuilderRoutes(): NorentLetterBuilderRouteInfo {
  return NorentRoutes.locale.letter;
}

const NorentLbAskName = NorentOnboardingStep(AskNameStep);

/**
 * This function defines all routes within the NoRent Letter Builder flow.
 * To find the map of each route to its corresponding URL path, check out
 * the `routes-info.ts` file in the same directory as this file.
 */
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
      createCrossSiteAgreeToTermsStep(routes.crossSiteAgreeToTerms),
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
      ]),
      {
        path: routes.knowYourRights,
        exact: true,
        shouldBeSkipped: (s) =>
          isUserLoggedIn(s) ? hasUserSeenRttcCheckboxYet(s) : false,
        component: NorentLbKnowYourRights,
      },
      ...skipStepsIf(isUserLoggedIn, [
        {
          path: routes.nationalAddress,
          exact: false,
          shouldBeSkipped: isUserInNYC,
          component: NorentLbAskNationalAddress,
        },
      ]),
      {
        path: routes.laAddress,
        exact: true,
        shouldBeSkipped: (s) =>
          isUserOutsideLA(s)
            ? true
            : isUserLoggedIn(s)
            ? hasUserSeenSajeCheckboxYet(s)
            : false,
        component: NorentLbLosAngelesKyr,
      },
      ...skipStepsIf(isUserLoggedIn, [
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
        path: routes.menu,
        exact: true,
        shouldBeSkipped: hasNorentLetterNeverBeenSent,
        component: NorentMenu,
      },
      ...skipStepsIf(hasNorentLetterBeenSentForAllRentPeriods, [
        {
          path: routes.landlordName,
          exact: true,
          component: NorentLandlordNameAndContactTypes,
        },
        {
          path: routes.landlordEmail,
          exact: true,
          shouldBeSkipped: shouldSkipLandlordEmailStep,
          component: NorentLandlordEmail,
        },
        {
          path: routes.landlordAddress,
          exact: false,
          shouldBeSkipped: shouldSkipLandlordMailingAddressStep,
          component: NorentLandlordMailingAddress,
        },
        {
          path: routes.rentPeriods,
          exact: true,
          component: NorentRentPeriodsWithModal,
        },
        {
          path: routes.rentPeriodsPostModal,
          exact: true,
          component: NorentRentPeriods,
        },
        {
          path: routes.preview,
          exact: false,
          component: NorentLetterPreviewPage,
        },
      ]),
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
