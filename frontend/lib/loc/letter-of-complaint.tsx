import React, { useContext } from "react";
import Page from "../ui/page";
import Routes from "../justfix-routes";
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
import { LocSplash } from "./letter-of-complaint-splash";
import { GetStartedButton } from "../ui/get-started-button";
import { OnboardingInfoSignupIntent } from "../queries/globalTypes";
import { CovidRiskBanner, MoratoriumWarning } from "../ui/covid-banners";
import ReliefAttemptsPage from "../onboarding/relief-attempts";
import { isUserNycha } from "../util/nycha";
import { createJustfixCrossSiteVisitorSteps } from "../justfix-cross-site-visitor-steps";
import { ProgressStepProps } from "../progress/progress-step-route";
import { assertNotNull } from "../util/util";

export const Welcome: React.FC<ProgressStepProps> = (props) => {
  const { firstName } = useContext(AppContext).session;

  return (
    <Page title="Let's start your letter!">
      <div className="content">
        <h1 className="title">
          Hi {firstName}, welcome to JustFix.nyc! Let's start your Letter of
          Complaint.
        </h1>
        <p>
          We're going to help you create a customized Letter of Complaint that
          highlights the issues in your apartment that need repair.{" "}
          <strong>This will take about 5 minutes.</strong>
        </p>
        <ol className="has-text-left">
          <li>
            First, conduct a <strong>self-inspection of your apartment</strong>{" "}
            to document all the issues that need repair.
          </li>
          <li>
            Review your Letter of Complaint and JustFix.nyc will send it to your
            landlord via USPS Certified Mail<sup>&reg;</sup>.
          </li>
        </ol>
        <CovidRiskBanner />
        <GetStartedButton
          to={assertNotNull(props.nextStep)}
          intent={OnboardingInfoSignupIntent.LOC}
          pageType="welcome"
        >
          Start my free letter
        </GetStartedButton>
        <MoratoriumWarning />
        <h2>Why mail a Letter of Complaint?</h2>
        <p>
          Your landlord is responsible for keeping your apartment and the
          building safe and livable at all times. This is called the{" "}
          <strong>Warranty of Habitability</strong>.
        </p>
        <p>
          <strong>
            Having a record of notifying your landlord makes for a stronger
            legal case.
          </strong>{" "}
          If your landlord has been unresponsive to your requests to make
          repairs, a letter is a <strong>great tactic to start</strong>. Through
          USPS Certified Mail<sup>&reg;</sup>, you will have an official record
          of the requests you’ve made to your landlord.
        </p>
      </div>
    </Page>
  );
};

const LetterOfComplaintIssuesRoutes = () => (
  <IssuesRoutes
    routes={Routes.locale.loc.issues}
    toBack={Routes.locale.loc.welcome}
    toNext={Routes.locale.loc.accessDates}
  />
);

export const getLOCProgressRoutesProps = (): ProgressRoutesProps => ({
  toLatestStep: Routes.locale.loc.latestStep,
  label: "Letter of Complaint",
  welcomeSteps: [
    {
      path: Routes.locale.loc.splash,
      exact: true,
      component: LocSplash,
      isComplete: (s) => !!s.phoneNumber,
    },
    {
      path: Routes.locale.loc.welcome,
      exact: true,
      component: Welcome,
    },
  ],
  stepsToFillOut: [
    ...createJustfixCrossSiteVisitorSteps(Routes.locale.loc),
    {
      path: Routes.locale.loc.issues.prefix,
      component: LetterOfComplaintIssuesRoutes,
    },
    {
      path: Routes.locale.loc.accessDates,
      exact: true,
      component: AccessDatesPage,
    },
    {
      path: Routes.locale.loc.reliefAttempts,
      component: ReliefAttemptsPage,
      shouldBeSkipped: isUserNycha,
    },
    {
      path: Routes.locale.loc.yourLandlord,
      exact: true,
      component: LandlordDetailsPage,
    },
    {
      path: Routes.locale.loc.preview,
      component: LetterRequestPage,
      isComplete: (sess) => !!sess.letterRequest,
    },
  ],
  confirmationSteps: [
    {
      path: Routes.locale.loc.confirmation,
      exact: true,
      component: LetterConfirmation,
    },
  ],
});

const LetterOfComplaintRoutes = buildProgressRoutesComponent(
  getLOCProgressRoutesProps
);

export default LetterOfComplaintRoutes;
