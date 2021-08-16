import { Trans, t } from "@lingui/macro";
import React from "react";
import { useLocation } from "react-router-dom";
import { AskCityState } from "../../common-steps/ask-city-state";
import { AskEmail } from "../../common-steps/ask-email";
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
import { li18n } from "../../i18n-lingui";
import { createCrossSiteAgreeToTermsStep } from "../../pages/cross-site-terms-opt-in";
import {
  buildProgressRoutesComponent,
  ProgressRoutesProps,
} from "../../progress/progress-routes";
import {
  MiddleProgressStep,
  ProgressStepProps,
} from "../../progress/progress-step-route";
import { skipStepsIf } from "../../progress/skip-steps-if";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { createStartAccountOrLoginRouteInfo } from "../../start-account-or-login/route-info";
import { createStartAccountOrLoginSteps } from "../../start-account-or-login/routes";
import Page from "../../ui/page";
import {
  isUserLoggedIn,
  isUserLoggedInWithEmail,
} from "../../util/session-predicates";
import { EvictionFreeRoutes } from "../route-info";
import { EvictionFreeAgreeToLegalTerms } from "./agree-to-legal-terms";
import { EvictionFreeDbConfirmation } from "./confirmation";
import { EvictionFreeCovidImpact } from "./covid-impact";
import { EvictionFreeCreateAccount } from "./create-account";
import { EvictionFreeIndexNumber } from "./index-number";
import { EvictionFreePreviewPage } from "./preview";
import { EvictionFreeRedirectToHomepageWithMessage } from "./redirect-to-homepage-with-message";
import {
  EvictionFreeNotSentDeclarationStep,
  EvictionFreeOnboardingStep,
  hasEvictionFreeDeclarationBeenSent,
} from "./step-decorators";
import { EvictionFreeDbWelcome } from "./welcome";

const DEFAULT_STEP_CONTENT = (
  <p>
    <Trans>
      We'll include this information in your hardship declaration form.
    </Trans>
  </p>
);

// TODO: An identical function exists in NoRent's codebase, ideally we should
// consolidate.
function isUserInNYC(s: AllSessionInfo): boolean {
  return s.onboardingScaffolding?.isCityInNyc || false;
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
    forState="NY"
    /* https://anthonylouisdagostino.com/bounding-boxes-for-all-us-states/ */
    bbox={[-79.762152, 40.496103, -71.856214, 45.01585]}
  >
    {DEFAULT_STEP_CONTENT}
  </AskCityState>
));

const EfAskEmail = MiddleProgressStep((props) => (
  <AskEmail {...props} isOptional>
    <p>
      <strong>
        <Trans>Highly recommended.</Trans>
      </strong>{" "}
      <Trans id="evictionfree.askForEmail">
        We'll use this information to email you a copy of your hardship
        declaration form. If possible, we’ll also forward you any confirmation
        emails from the courts once they receive your declaration form.
      </Trans>
    </p>
  </AskEmail>
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

const EfLandlordNameAndContactTypes = EvictionFreeNotSentDeclarationStep(
  (props) => (
    <LandlordNameAndContactTypes {...props}>
      <p>
        <Trans>
          We'll use this information to send your hardship declaration form.
        </Trans>
      </p>
    </LandlordNameAndContactTypes>
  )
);

const EfLandlordEmail = EvictionFreeNotSentDeclarationStep((props) => (
  <LandlordEmail
    {...props}
    introText={
      <Trans>
        We'll use this information to send your hardship declaration form.
      </Trans>
    }
  />
));

const EfLandlordMailingAddress = EvictionFreeNotSentDeclarationStep((props) => (
  <LandlordMailingAddress
    {...props}
    confirmModalRoute={
      EvictionFreeRoutes.locale.declaration.landlordAddressConfirmModal
    }
  >
    <p>
      <Trans>
        We'll use this information to send your hardship declaration form via
        certified mail for free.
      </Trans>
    </p>
  </LandlordMailingAddress>
));

const EfOutsideNewYork: React.FC<ProgressStepProps> = (props) => (
  <Page
    title={li18n._(t`You don't live in New York`)}
    withHeading="big"
    className="content"
  >
    <p>
      <Trans>
        Unfortunately, this tool is currently only available to individuals who
        live in the state of New York.
      </Trans>
    </p>
  </Page>
);

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
      createCrossSiteAgreeToTermsStep(routes.crossSiteAgreeToTerms),
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
        path: routes.email,
        exact: true,
        component: EfAskEmail,
        shouldBeSkipped: (s) =>
          isUserLoggedInWithEmail(s) || hasEvictionFreeDeclarationBeenSent(s),
      },
      {
        path: routes.createAccount,
        component: EvictionFreeCreateAccount,
        shouldBeSkipped: isUserLoggedIn,
      },
      {
        path: routes.outsideNewYork,
        exact: true,
        component: EfOutsideNewYork,
        shouldBeSkipped: (s) => s.onboardingInfo?.state === "NY",
      },
      ...skipStepsIf(hasEvictionFreeDeclarationBeenSent, [
        {
          path: routes.hardshipSituation,
          exact: true,
          component: EvictionFreeCovidImpact,
        },
        {
          path: routes.indexNumber,
          exact: true,
          component: EvictionFreeIndexNumber,
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
        {
          path: routes.agreeToLegalTerms,
          exact: true,
          component: EvictionFreeAgreeToLegalTerms,
        },
        {
          path: routes.preview,
          exact: false,
          component: EvictionFreePreviewPage,
        },
      ]),
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

const OriginalEvictionFreeDeclarationBuilderRoutes = buildProgressRoutesComponent(
  getEvictionFreeDeclarationBuilderProgressRoutesProps
);

export const EvictionFreeDeclarationBuilderRoutes: React.FC<{}> = () => {
  const location = useLocation();
  const routes = EvictionFreeRoutes.locale.declaration;
  const loginRoutes = Object.values(
    createStartAccountOrLoginRouteInfo(routes.prefix)
  );
  const excludedRoutes = new Set([
    routes.latestStep,
    routes.welcome,
    ...loginRoutes,
    routes.confirmation,
  ]);

  if (excludedRoutes.has(location.pathname)) {
    return <OriginalEvictionFreeDeclarationBuilderRoutes />;
  }

  return <EvictionFreeRedirectToHomepageWithMessage />;
};
