import React from "react";
import { Switch, Route } from "react-router-dom";
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
import { LaLetterBuilderMyLetters, WelcomeMyLetters } from "../my-letters";
import { LaLetterBuilderCreateAccount } from "../../components/create-account";
import {
  HabitabilityLetterForUserStaticPage,
  HabitabilityLetterEmailToLandlordForUserStaticPage,
  HabitabilitySampleLetterSamplePage,
  HabitabilityLetterEmailToLandlordForUser,
  HabitabilityLetterTranslation,
} from "./habitability-letter-content";
import { createLaLetterBuilderPreviewPage } from "../../components/letter-preview";
import { LaLetterBuilderSendOptions } from "../send-options";
import {
  LaLetterBuilderAskName,
  LaLetterBuilderAskCityState,
  LaLetterBuilderAskNationalAddress,
} from "../../components/personal-info";
import { LaLetterBuilderLandlordNameAddress } from "../../components/landlord-info";
import { LaLetterBuilderReviewRights } from "../../components/review-your-rights";
import { t } from "@lingui/macro";
import { li18n } from "../../../i18n-lingui";
import { LaIssuesRoutes } from "./issues";

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
  const createAccountSteps = [
    {
      path: routes.name,
      exact: true,
      component: LaLetterBuilderAskName,
      shouldBeSkipped: isUserLoggedIn,
    },
    {
      path: routes.city,
      exact: false,
      component: LaLetterBuilderAskCityState,
      shouldBeSkipped: isUserLoggedIn,
    },
    {
      path: routes.nationalAddress,
      exact: false,
      // TODO: add something that short circuits if the user isn't in LA
      component: LaLetterBuilderAskNationalAddress,
      shouldBeSkipped: isUserLoggedIn,
    },
    {
      path: routes.reviewRights,
      component: LaLetterBuilderReviewRights,
      shouldBeSkipped: isUserLoggedIn,
    },
    {
      path: routes.createAccount,
      component: LaLetterBuilderCreateAccount,
      shouldBeSkipped: isUserLoggedIn,
    },
  ];

  return {
    label: li18n._(t`Build your Letter`),
    introProgressSection: {
      label: li18n._(t`Create an Account`),
      num_steps: createAccountSteps.length,
    },
    toLatestStep: routes.latestStep,
    welcomeSteps: [
      {
        path: routes.welcome,
        exact: true,
        component: WelcomeMyLetters,
        isComplete: (s) => !!s.phoneNumber,
      },
      ...skipStepsIf(isUserLoggedIn, [
        ...createStartAccountOrLoginSteps(
          routes,
          LaLetterBuilderRouteInfo.locale.home
        ),
      ]),
    ],
    stepsToFillOut: [
      ...skipStepsIf(isUserLoggedIn, [...createAccountSteps]),

      {
        path: routes.myLetters,
        exact: true,
        component: LaLetterBuilderMyLetters,
        hideProgressBar: true,
        isComplete: (s) => !!s.phoneNumber,
      },
      {
        path: routes.issues.prefix,
        component: LaLetterBuilderIssuesRoutes,
      },
      {
        path: routes.landlordInfo,
        exact: false,
        component: LaLetterBuilderLandlordNameAddress,
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
        exact: false,
        component: LaLetterBuilderSendOptions,
      },
    ],
    confirmationSteps: [
      {
        path: routes.confirmation,
        exact: true,
        component: LaLetterBuilderMyLetters,
      },
    ],
  };
};

export const HabitabilityProgressRoutes = buildProgressRoutesComponent(
  getHabitabilityProgressRoutesProps
);

const LaLetterBuilderIssuesRoutes = () => (
  <LaIssuesRoutes
    routes={LaLetterBuilderRouteInfo.locale.habitability.issues}
    toBack={LaLetterBuilderRouteInfo.locale.habitability.myLetters}
    toNext={LaLetterBuilderRouteInfo.locale.habitability.landlordInfo}
  ></LaIssuesRoutes>
);

const HabitabilityPreviewPage = createLaLetterBuilderPreviewPage(
  LaLetterBuilderRouteInfo.getLocale("en").habitability.letterContent,
  HabitabilityLetterEmailToLandlordForUser,
  HabitabilityLetterTranslation
);

export default HabitabilityRoutes;
