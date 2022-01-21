import React from "react";

import { AskCityState } from "../../common-steps/ask-city-state";
import { AskNameStep } from "../../common-steps/ask-name";
import { AskNationalAddress } from "../../common-steps/ask-national-address";
import {
  ProgressRoutesProps,
  buildProgressRoutesComponent,
} from "../../progress/progress-routes";
import { skipStepsIf } from "../../progress/skip-steps-if";
import { createStartAccountOrLoginSteps } from "../../start-account-or-login/routes";
import { isUserLoggedIn } from "../../util/session-predicates";
import { LaLetterBuilderRouteInfo } from "../route-info";
import { LaLetterBuilderChooseLetterStep } from "./choose-letter";
import { LaLetterBuilderCreateAccount } from "./create-account";
import { LaLetterBuilderOnboardingStep } from "./step-decorators";
import { LaLetterBuilderWelcome } from "./welcome";
import AccessDatesPage from "../../loc/access-dates";
import {
  shouldSkipLandlordEmailStep,
  LandlordEmail,
} from "../../common-steps/landlord-email";
import LandlordMailingAddress, {
  shouldSkipLandlordMailingAddressStep,
} from "../../common-steps/landlord-mailing-address";
import { LandlordNameAndContactTypes } from "../../common-steps/landlord-name-and-contact-types";
import { LaLetterBuilderConfirmation } from "./confirmation";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { IssuesRoutes } from "../../issues/routes";
import { LaLetterBuilderPreview } from "./letter-preview";
import { LaLetterBuilderSendOptions } from "./send-options";

const LaLetterBuilderAskName = LaLetterBuilderOnboardingStep(AskNameStep);
const LaLetterBuilderAskCityState = LaLetterBuilderOnboardingStep((props) => (
  <AskCityState
    {...props}
    confirmModalRoute={LaLetterBuilderRouteInfo.locale.letter.cityConfirmModal}
  >
    <p>must be California</p>
  </AskCityState>
));
const LaLetterBuilderAskNationalAddress = LaLetterBuilderOnboardingStep(
  (props) => (
    <AskNationalAddress
      {...props}
      routes={LaLetterBuilderRouteInfo.locale.letter}
    >
      <p>TODO: Add content here.</p>
    </AskNationalAddress>
  )
);

const LaLetterBuilderLandlordNameAndContactTypes = MiddleProgressStep(
  (props) => (
    <LandlordNameAndContactTypes {...props}>
      <p>TODO: Add content here.</p>
    </LandlordNameAndContactTypes>
  )
);
const LaLetterBuilderLandlordEmail = MiddleProgressStep((props) => (
  <LandlordEmail {...props} introText="TODO: Add content here." />
));

const LaLetterBuilderLandlordMailingAddress = MiddleProgressStep((props) => (
  <LandlordMailingAddress
    {...props}
    confirmModalRoute={
      LaLetterBuilderRouteInfo.locale.letter.landlordAddressConfirmModal
    }
  >
    <p>TODO: Add content here.</p>
  </LandlordMailingAddress>
));

const LaLetterBuilderIssuesRoutes = () => (
  <IssuesRoutes
    routes={LaLetterBuilderRouteInfo.locale.letter.issues}
    toBack={LaLetterBuilderRouteInfo.locale.letter.landlordAddress}
    toNext={LaLetterBuilderRouteInfo.locale.letter.accessDates}
  ></IssuesRoutes>
);

export const getLaLetterBuilderProgressRoutesProps = (): ProgressRoutesProps => {
  const routes = LaLetterBuilderRouteInfo.locale.letter;

  return {
    toLatestStep: routes.latestStep,
    welcomeSteps: [
      {
        path: routes.welcome,
        exact: true,
        component: LaLetterBuilderWelcome,
      },
      ...createStartAccountOrLoginSteps(routes),
    ],
    stepsToFillOut: [
      ...skipStepsIf(isUserLoggedIn, [
        {
          path: routes.name,
          exact: true,
          component: LaLetterBuilderAskName,
        },
        {
          path: routes.city,
          exact: false,
          component: LaLetterBuilderAskCityState,
        },
        {
          path: routes.nationalAddress,
          exact: false,
          // TODO: add something that short circuits if the user isn't in LA
          component: LaLetterBuilderAskNationalAddress,
        },
      ]),
      {
        path: routes.createAccount,
        component: LaLetterBuilderCreateAccount,
        shouldBeSkipped: isUserLoggedIn,
      },
      {
        path: routes.chooseLetter,
        exact: true,
        component: LaLetterBuilderChooseLetterStep,
      },
      {
        path: routes.landlordName,
        exact: true,
        component: LaLetterBuilderLandlordNameAndContactTypes,
      },
      {
        path: routes.landlordEmail,
        exact: true,
        shouldBeSkipped: shouldSkipLandlordEmailStep,
        component: LaLetterBuilderLandlordEmail,
      },
      {
        path: routes.landlordAddress,
        exact: false,
        shouldBeSkipped: shouldSkipLandlordMailingAddressStep,
        component: LaLetterBuilderLandlordMailingAddress,
      },
      {
        path: routes.issues.prefix,
        component: LaLetterBuilderIssuesRoutes,
      },
      {
        path: routes.accessDates,
        exact: true,
        component: AccessDatesPage,
      },
      {
        path: routes.preview,
        exact: true,
        component: LaLetterBuilderPreview,
      },
      {
        path: routes.sending,
        exact: true,
        component: LaLetterBuilderSendOptions,
      },
    ],
    confirmationSteps: [
      {
        path: routes.confirmation,
        exact: true,
        component: LaLetterBuilderConfirmation,
      },
    ],
  };
};

export const LaLetterBuilderRoutes = buildProgressRoutesComponent(
  getLaLetterBuilderProgressRoutesProps
);
