import React, { useContext } from "react";
import Page from "../ui/page";
import JustfixRoutes from "../justfix-routes";
import { AppContext } from "../app-context";
import { IssuesRoutes } from "../issues/issue-pages";
import AccessDatesPage from "./access-dates";
import LandlordDetailsPage from "./landlord-details";
import LetterRequestPage from "./letter-request";
import LetterConfirmation from "./loc-confirmation";
import {
  ProgressRoutesProps,
  buildProgressRoutesComponent,
} from "../progress/progress-routes";
import { LocSplash, WhyMailALetter } from "./letter-of-complaint-splash";
import { GetStartedButton } from "../ui/get-started-button";
import { OnboardingInfoSignupIntent } from "../queries/globalTypes";
import { CovidRiskBanner, MoratoriumWarning } from "../ui/covid-banners";
import ReliefAttemptsPage from "./relief-attempts";
import { isUserNycha } from "../util/nycha";
import { createJustfixCrossSiteVisitorSteps } from "../justfix-cross-site-visitor-steps";
import { ProgressStepProps } from "../progress/progress-step-route";
import { assertNotNull } from "../util/util";
import { Switch, Route } from "react-router-dom";
import { LocSamplePage, LocForUserPage } from "./letter-content";
import { createLetterStaticPageRoutes } from "../static-page/routes";
import { NycUsersOnly } from "../pages/nyc-users-only";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";

export const Welcome: React.FC<ProgressStepProps> = (props) => {
  const { firstName } = useContext(AppContext).session;

  return (
    <Page title={li18n._(t`Let's start your letter!`)}>
      <div className="content">
        <h1 className="title">
          <Trans>
            Hi {firstName}, welcome to JustFix.nyc! Let's start your Letter of
            Complaint.
          </Trans>
        </h1>
        <p>
          <Trans>
            We're going to help you create a customized Letter of Complaint that
            highlights the issues in your apartment that need repair.{" "}
            <strong>This will take about 5 minutes.</strong>
          </Trans>
        </p>
        <ol className="has-text-left">
          <li>
            <Trans>
              First, conduct a{" "}
              <strong>self-inspection of your apartment</strong> to document all
              the issues that need repair.
            </Trans>
          </li>
          <li>
            <Trans>
              Review your Letter of Complaint and JustFix.nyc will send it to
              your landlord via USPS Certified Mail<sup>&reg;</sup>.
            </Trans>
          </li>
        </ol>
        <CovidRiskBanner />
        <GetStartedButton
          to={assertNotNull(props.nextStep)}
          intent={OnboardingInfoSignupIntent.LOC}
          pageType="welcome"
        >
          <Trans>Start my free letter</Trans>
        </GetStartedButton>
        <MoratoriumWarning />
        <WhyMailALetter />
      </div>
    </Page>
  );
};

const LetterOfComplaintIssuesRoutes = () => (
  <IssuesRoutes
    routes={JustfixRoutes.locale.loc.issues}
    toBack={JustfixRoutes.locale.loc.welcome}
    toNext={JustfixRoutes.locale.loc.accessDates}
  />
);

export const getLOCProgressRoutesProps = (): ProgressRoutesProps => ({
  toLatestStep: JustfixRoutes.locale.loc.latestStep,
  label: li18n._(t`Letter of Complaint`),
  defaultWrapContent: NycUsersOnly,
  welcomeSteps: [
    {
      path: JustfixRoutes.locale.loc.splash,
      wrapContent: false,
      exact: true,
      component: LocSplash,
      isComplete: (s) => !!s.phoneNumber,
    },
    {
      path: JustfixRoutes.locale.loc.welcome,
      exact: true,
      component: Welcome,
    },
  ],
  stepsToFillOut: [
    ...createJustfixCrossSiteVisitorSteps(JustfixRoutes.locale.loc),
    {
      path: JustfixRoutes.locale.loc.issues.prefix,
      component: LetterOfComplaintIssuesRoutes,
    },
    {
      path: JustfixRoutes.locale.loc.accessDates,
      exact: true,
      component: AccessDatesPage,
    },
    {
      path: JustfixRoutes.locale.loc.reliefAttempts,
      component: ReliefAttemptsPage,
      shouldBeSkipped: isUserNycha,
    },
    {
      path: JustfixRoutes.locale.loc.yourLandlord,
      exact: true,
      component: LandlordDetailsPage,
    },
    {
      path: JustfixRoutes.locale.loc.preview,
      component: LetterRequestPage,
      isComplete: (sess) => !!sess.letterRequest,
    },
  ],
  confirmationSteps: [
    {
      path: JustfixRoutes.locale.loc.confirmation,
      exact: true,
      component: LetterConfirmation,
    },
  ],
});

const LetterOfComplaintProgressRoutes = buildProgressRoutesComponent(
  getLOCProgressRoutesProps
);

const LetterOfComplaintRoutes: React.FC<{}> = () => (
  <Switch>
    {createLetterStaticPageRoutes(
      JustfixRoutes.locale.loc.sampleLetterContent,
      LocSamplePage
    )}
    {createLetterStaticPageRoutes(
      JustfixRoutes.locale.loc.letterContent,
      LocForUserPage
    )}
    <Route component={LetterOfComplaintProgressRoutes} />
  </Switch>
);

export default LetterOfComplaintRoutes;
