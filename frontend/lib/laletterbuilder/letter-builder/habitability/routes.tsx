import React from "react";
import { Switch, Route } from "react-router-dom";
import { shouldSkipLandlordEmailStep } from "../../../common-steps/landlord-email";
import { shouldSkipLandlordMailingAddressStep } from "../../../common-steps/landlord-mailing-address";
import AccessDatesPage from "../../../loc/access-dates";
import {
  ProgressRoutesProps,
  buildProgressRoutesComponent,
} from "../../../progress/progress-routes";
import { skipStepsIf } from "../../../progress/skip-steps-if";
import { createStartAccountOrLoginSteps } from "../../../start-account-or-login/routes";
import { createLetterStaticPageRoutes } from "../../../static-page/routes";
import { isUserLoggedIn } from "../../../util/session-predicates";
import { LaLetterBuilderRouteInfo } from "../../route-info";
import { LaLetterBuilderConfirmation } from "../confirmation";
import { LaLetterBuilderCreateAccount } from "../../components/create-account";
import {
  HabitabilityLetterForUserStaticPage,
  HabitabilityLetterEmailToLandlordForUserStaticPage,
  HabitabilitySampleLetterSamplePage,
} from "./habitability-letter-content";
import { createLaLetterBuilderPreviewPage } from "../../components/letter-preview";
import { LaLetterBuilderSendOptions } from "../send-options";
import { LaLetterBuilderWelcome } from "../welcome";
import {
  LaLetterBuilderAskName,
  LaLetterBuilderAskCityState,
  LaLetterBuilderAskNationalAddress,
  LaLetterBuilderLandlordNameAndContactTypes,
  LaLetterBuilderLandlordEmail,
  LaLetterBuilderLandlordMailingAddress,
} from "../../components/useful-components";
import { IssuesRoutes } from "../../../issues/routes";
import { LaLetterBuilderLandlordNameAddressEmail } from "../../components/landlord-info";

const HabitabilityRoutes: React.FC<{}> = () => (
  <Switch>
    {createLetterStaticPageRoutes(
      LaLetterBuilderRouteInfo.locale.habitability.letterContent,
      HabitabilityLetterForUserStaticPage
    )}
    <Route
      path={LaLetterBuilderRouteInfo.locale.habitability.letterEmail}
      exact
      component={HabitabilityLetterEmailToLandlordForUserStaticPage}
    />
    {createLetterStaticPageRoutes(
      LaLetterBuilderRouteInfo.locale.habitability.sampleLetterContent,
      HabitabilitySampleLetterSamplePage
    )}
    <Route component={HabitabilityProgressRoutes} />
  </Switch>
);

export const getHabitabilityProgressRoutesProps = (): ProgressRoutesProps => {
  const routes = LaLetterBuilderRouteInfo.locale.habitability;

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
        path: routes.landlordInfo,
        exact: true,
        component: LaLetterBuilderLandlordNameAddressEmail,
      },
      /**{
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
      },*/
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
        component: HabitabilityPreviewPage,
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

export const HabitabilityProgressRoutes = buildProgressRoutesComponent(
  getHabitabilityProgressRoutesProps
);

const LaLetterBuilderIssuesRoutes = () => (
  <IssuesRoutes
    routes={LaLetterBuilderRouteInfo.locale.habitability.issues}
    toBack={LaLetterBuilderRouteInfo.locale.habitability.landlordInfo}
    toNext={LaLetterBuilderRouteInfo.locale.habitability.accessDates}
  ></IssuesRoutes>
);

const HabitabilityPreviewPage = createLaLetterBuilderPreviewPage(
  LaLetterBuilderRouteInfo.getLocale("en").habitability.letterContent
);

export default HabitabilityRoutes;
