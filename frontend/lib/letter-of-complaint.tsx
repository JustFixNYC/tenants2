import React from 'react';
import Page from './page';
import Routes from './routes';
import { withAppContext, AppContextType } from './app-context';
import { IssuesRoutes } from './pages/issue-pages';
import AccessDatesPage from './pages/access-dates';
import LandlordDetailsPage from './pages/landlord-details';
import LetterRequestPage from './pages/letter-request';
import LetterConfirmation from './pages/loc-confirmation';
import { CenteredPrimaryButtonLink } from './buttons';
import { ProgressRoutesProps, buildProgressRoutesComponent } from './progress-routes';

export const Welcome = withAppContext((props: AppContextType): JSX.Element => {
  const { firstName } = props.session;

  return (
    <Page title="Let's start your letter!">
      <div className="content">
        <h1 className="title">Hi {firstName}, welcome to JustFix.nyc! Let's start your Letter of Complaint.</h1>
        <p>
          We're going to help you create a customized Letter of Complaint that highlights the issues in your apartment that need repair. <strong>This will take about 5 minutes.</strong>
        </p>
        <ol className="has-text-left">
          <li>First, conduct a <strong>self-inspection of your apartment</strong> to document all the issues that need repair.</li>
          <li>Review your Letter of Complaint and JustFix.nyc will send it to your landlord via USPS Certified Mail<sup>&reg;</sup>.</li>
        </ol>
        <CenteredPrimaryButtonLink to={Routes.locale.loc.issues.home}>
          Start my free letter
        </CenteredPrimaryButtonLink>
        <br/>
        <h2>Why mail a Letter of Complaint?</h2>
        <p>
          Your landlord is responsible for keeping your apartment and the building safe and livable at all times. This is called the <strong>Warranty of Habitability</strong>.
        </p>
        <p>
          <strong>Having a record of notifying your landlord makes for a stronger legal case.</strong> If your landlord has been unresponsive to your requests to make repairs, a letter is a <strong>great tactic to start</strong>. Through USPS Certified Mail<sup>&reg;</sup>, you will have an official record of the requests you’ve made to your landlord.
        </p>
      </div>
    </Page>
  );
});

const LetterOfComplaintIssuesRoutes = () => (
  <IssuesRoutes
    routes={Routes.locale.loc.issues}
    toBack={Routes.locale.loc.home}
    toNext={Routes.locale.loc.accessDates}
  />
);

export const LOCProgressRoutesProps: ProgressRoutesProps = {
  toLatestStep: Routes.locale.loc.latestStep,
  label: "Letter of Complaint",
  welcomeSteps: [{
    path: Routes.locale.loc.home, exact: true, component: Welcome
  }],
  stepsToFillOut: [
    { path: Routes.locale.loc.issues.prefix, component: LetterOfComplaintIssuesRoutes },
    { path: Routes.locale.loc.accessDates, exact: true, component: AccessDatesPage },
    { path: Routes.locale.loc.yourLandlord, exact: true, component: LandlordDetailsPage },
    { path: Routes.locale.loc.preview, component: LetterRequestPage,
      isComplete: sess => !!sess.letterRequest },
  ],
  confirmationSteps: [{
    path: Routes.locale.loc.confirmation, exact: true, component: LetterConfirmation
  }]
};

const LetterOfComplaintRoutes = buildProgressRoutesComponent(LOCProgressRoutesProps);

export default LetterOfComplaintRoutes;
