import React, { useContext } from "react";
import Page from "../ui/page";
import JustfixRoutes from "../justfix-route-info";
import { AppContext } from "../app-context";
import { IssuesRoutes } from "../issues/routes";
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
import ReliefAttemptsPage from "../onboarding/relief-attempts";
import { isUserNonNycha, isUserNycha } from "../util/nycha";
import { createJustfixCrossSiteVisitorSteps } from "../justfix-cross-site-visitor-routes";
import { ProgressStepProps } from "../progress/progress-step-route";
import { assertNotNull } from "@justfixnyc/util";
import { Switch, Route } from "react-router-dom";
import { LocSamplePage, LocForUserPage } from "./letter-content";
import { createLetterStaticPageRoutes } from "../static-page/routes";
import { NycUsersOnly } from "../pages/nyc-users-only";
import WorkOrdersPage from "./work-orders";

export const Welcome: React.FC<ProgressStepProps> = (props) => {
  const session = useContext(AppContext).session;
  const bestFirstName = session.preferredFirstName || session.firstName;

  return (
    <Page title="Let's start your letter!">
      <div className="content">
        <h1 className="title">
          Hi {bestFirstName}, welcome to JustFix! Let's start your Letter of
          Complaint.
        </h1>
        <p>
          We're going to help you create a customized Letter of Complaint that
          highlights the issues in your home that need repair.{" "}
          <strong>This will take about 5 minutes.</strong>
        </p>
        <ol className="has-text-left">
          <li>
            First, conduct a <strong>self-inspection of your home</strong> to
            document all the issues that need repair.
          </li>
          <li>
            Review your Letter of Complaint and we will send it to your landlord
            via USPS Certified Mail<sup>&reg;</sup>.
          </li>
        </ol>
        <GetStartedButton
          to={assertNotNull(props.nextStep)}
          intent={OnboardingInfoSignupIntent.LOC}
          pageType="welcome"
        >
          Start my free letter
        </GetStartedButton>
        <h2>Why mail a Letter of Complaint?</h2>
        <p>
          Your landlord is responsible for keeping your home and building safe
          and livable at all times. This is called the{" "}
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
    routes={JustfixRoutes.locale.loc.issues}
    toBack={JustfixRoutes.locale.loc.welcome}
    toNext={JustfixRoutes.locale.loc.accessDates}
  />
);

export const getLOCProgressRoutesProps = (): ProgressRoutesProps => ({
  toLatestStep: JustfixRoutes.locale.loc.latestStep,
  label: "Letter of Complaint",
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
      path: JustfixRoutes.locale.loc.workOrders,
      component: WorkOrdersPage,
      shouldBeSkipped: isUserNonNycha,
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
