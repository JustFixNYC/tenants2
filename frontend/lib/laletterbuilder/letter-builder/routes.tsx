import React from "react";

import { AskCityState } from "../../common-steps/ask-city-state";
import { AskNameStep } from "../../common-steps/ask-name";
import { AskNationalAddress } from "../../common-steps/ask-national-address";
import {
  shouldSkipLandlordEmailStep,
  LandlordEmail,
} from "../../common-steps/landlord-email";
import LandlordMailingAddress, {
  shouldSkipLandlordMailingAddressStep,
} from "../../common-steps/landlord-mailing-address";
import { LandlordNameAndContactTypes } from "../../common-steps/landlord-name-and-contact-types";
import {
  ProgressRoutesProps,
  buildProgressRoutesComponent,
} from "../../progress/progress-routes";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { skipStepsIf } from "../../progress/skip-steps-if";
import { createStartAccountOrLoginSteps } from "../../start-account-or-login/routes";
import { isUserLoggedIn } from "../../util/session-predicates";
import { LALetterBuilderRoutes } from "../route-info";
import { LALetterBuilderConfirmation } from "./confirmation";
import { LALetterBuilderCreateAccount } from "./create-account";
import { LALetterBuilderOnboardingStep } from "./step-decorators";
import { LALetterBuilderWelcome } from "./welcome";
import { createCrossSiteAgreeToTermsStep } from "../../pages/cross-site-terms-opt-in";
import { ChooseLetterType } from "./choose-letters";

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

const LALetterBuilderLandlordNameAndContactTypes = MiddleProgressStep(
  (props) => (
    <LandlordNameAndContactTypes {...props}>
      <p>TODO: Add content here.</p>
    </LandlordNameAndContactTypes>
  )
);

const LALetterBuilderLandlordEmail = MiddleProgressStep((props) => (
  <LandlordEmail {...props} introText="TODO: Add content here." />
));

const LALetterBuilderLandlordMailingAddress = MiddleProgressStep((props) => (
  <LandlordMailingAddress
    {...props}
    confirmModalRoute={
      LALetterBuilderRoutes.locale.letter.landlordAddressConfirmModal
    }
  >
    <p>TODO: Add content here.</p>
  </LandlordMailingAddress>
));

export const LALetterBuilderChooseLetterType = MiddleProgressStep((props) => (
  <ChooseLetterType {...props} />
));

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
      createCrossSiteAgreeToTermsStep(routes.crossSiteAgreeToTerms),
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
      {
        path: routes.createAccount,
        component: LALetterBuilderCreateAccount,
        shouldBeSkipped: isUserLoggedIn,
      },
      {
        path: routes.landlordName,
        exact: true,
        component: LALetterBuilderLandlordNameAndContactTypes,
      },
      {
        path: routes.landlordEmail,
        exact: true,
        shouldBeSkipped: shouldSkipLandlordEmailStep,
        component: LALetterBuilderLandlordEmail,
      },
      {
        path: routes.landlordAddress,
        exact: false,
        shouldBeSkipped: shouldSkipLandlordMailingAddressStep,
        component: LALetterBuilderLandlordMailingAddress,
      },
      {
        path: routes.chooseLetter,
        exact: true,
        // TODO: figure out when to skip this, if ever (maybe if in the middle of a letter?)
        component: LALetterBuilderChooseLetterType,
      },
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
