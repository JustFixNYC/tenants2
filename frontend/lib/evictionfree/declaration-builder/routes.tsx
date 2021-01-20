import React from "react";
import { AskCityState } from "../../common-steps/ask-city-state";
import { AskNameStep } from "../../common-steps/ask-name";
import { AskNationalAddress } from "../../common-steps/ask-national-address";
import { AskNycAddress } from "../../common-steps/ask-nyc-address";
import {
  LandlordEmail,
  shouldSkipLandlordEmailStep,
} from "../../common-steps/landlord-email";
import LandlordMailingAddress, {
  shouldSkipLandlordMailingAddressStep,
} from "../../common-steps/landlord-mailing-address";
import { LandlordNameAndContactTypes } from "../../common-steps/landlord-name-and-contact-types";
import {
  buildProgressRoutesComponent,
  ProgressRoutesProps,
} from "../../progress/progress-routes";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { skipStepsIf } from "../../progress/skip-steps-if";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { createStartAccountOrLoginSteps } from "../../start-account-or-login/routes";
import { isUserLoggedIn } from "../../util/session-predicates";
import { EvictionFreeRoutes } from "../route-info";
import { EvictionFreeDbConfirmation } from "./confirmation";
import { EvictionFreeCovidImpact } from "./covid-impact";
import { EvictionFreeCreateAccount } from "./create-account";
import { EvictionFreeOnboardingStep } from "./step-decorators";
import { EvictionFreeDbWelcome } from "./welcome";

const DEFAULT_STEP_CONTENT = (
  <p>We'll include this information in your declaration.</p>
);

// TODO: An identical function exists in NoRent's codebase, ideally we should
// consolidate.
function isUserInNYC(s: AllSessionInfo): boolean {
  return s.norentScaffolding?.isCityInNyc || false;
}

// TODO: An identical function exists in NoRent's codebase, ideally we should
// consolidate.
function isUserOutsideNYC(s: AllSessionInfo): boolean {
  return !isUserInNYC(s);
}

const EfAskName = EvictionFreeOnboardingStep(AskNameStep);

const EfAskCityState = EvictionFreeOnboardingStep((props) => (
  <AskCityState
    {...props}
    confirmModalRoute={EvictionFreeRoutes.locale.declaration.cityConfirmModal}
  >
    {DEFAULT_STEP_CONTENT}
  </AskCityState>
));

const EfAskNationalAddress = EvictionFreeOnboardingStep((props) => (
  <AskNationalAddress {...props} routes={EvictionFreeRoutes.locale.declaration}>
    {DEFAULT_STEP_CONTENT}
  </AskNationalAddress>
));

const EfAskNycAddress = EvictionFreeOnboardingStep((props) => (
  <AskNycAddress
    {...props}
    confirmModalRoute={
      EvictionFreeRoutes.locale.declaration.nycAddressConfirmModal
    }
  >
    {DEFAULT_STEP_CONTENT}
  </AskNycAddress>
));

const EfLandlordNameAndContactTypes = MiddleProgressStep((props) => (
  <LandlordNameAndContactTypes {...props}>
    <p>We'll use this information to send your declaration.</p>
  </LandlordNameAndContactTypes>
));

const EfLandlordEmail = MiddleProgressStep((props) => (
  <LandlordEmail
    {...props}
    introText={<p>We'll use this information to send your declaration.</p>}
  />
));

const EfLandlordMailingAddress = MiddleProgressStep((props) => (
  <LandlordMailingAddress
    {...props}
    confirmModalRoute={
      EvictionFreeRoutes.locale.declaration.landlordAddressConfirmModal
    }
  >
    <p>
      We'll use this information to send your declaration via certified mail for
      free.
    </p>
  </LandlordMailingAddress>
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
          shouldBeSkipped: isUserInNYC,
          component: EfAskNationalAddress,
        },
        {
          path: routes.nycAddress,
          exact: false,
          shouldBeSkipped: isUserOutsideNYC,
          component: EfAskNycAddress,
        },
      ]),
      {
        path: routes.createAccount,
        component: EvictionFreeCreateAccount,
        shouldBeSkipped: isUserLoggedIn,
      },
      {
        path: routes.hardshipSituation,
        exact: true,
        component: EvictionFreeCovidImpact,
      },
      {
        path: routes.landlordName,
        exact: true,
        component: EfLandlordNameAndContactTypes,
      },
      {
        path: routes.landlordEmail,
        exact: true,
        shouldBeSkipped: shouldSkipLandlordEmailStep,
        component: EfLandlordEmail,
      },
      {
        path: routes.landlordAddress,
        exact: false,
        shouldBeSkipped: shouldSkipLandlordMailingAddressStep,
        component: EfLandlordMailingAddress,
      },
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
