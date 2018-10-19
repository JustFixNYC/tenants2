import React from 'react';
import Page from './page';
import { WhyMailALetterOfComplaint } from './letter-of-complaint-common';
import Routes from './routes';
import { IssuesRoutes } from './pages/issue-pages';
import AccessDatesPage from './pages/access-dates';
import LandlordDetailsPage from './pages/landlord-details';
import { RouteProgressBar } from './progress-bar';
import LetterRequestPage from './pages/letter-request';
import LetterConfirmation from './pages/loc-confirmation';
import { CenteredPrimaryButtonLink } from './buttons';
import { SessionProgressStepRoute, RedirectToLatestStep } from './progress-redirection';
import { Route } from 'react-router';


export function Welcome(): JSX.Element {
  return (
    <Page title="Let's start your letter!">
      <div className="content">
        <h1 className="title">Let's start your letter!</h1>
        <p>
          We're going to help you create a customized Letter of Complaint that highlights the issues in your apartment that need repair. This will take about 5 minutes.
        </p>
        <ol className="has-text-left">
          <li>First, conduct a self-inspection of your apartment to document all the issues that need repair.</li>
          <li>Review your Letter of Complaint and JustFix.nyc will mail it certified for you.</li>
        </ol>
        <CenteredPrimaryButtonLink to={Routes.loc.issues.home}>
          Add issues
        </CenteredPrimaryButtonLink>
        <br/>
        <WhyMailALetterOfComplaint heading="h3" />
      </div>
    </Page>
  );
}

export const letterOfComplaintSteps: SessionProgressStepRoute[] = [
  { path: Routes.loc.home, exact: true, component: Welcome },
  { path: Routes.loc.issues.prefix, component: IssuesRoutes },
  { path: Routes.loc.accessDates, exact: true, component: AccessDatesPage },
  { path: Routes.loc.yourLandlord, exact: true, component: LandlordDetailsPage },
  { path: Routes.loc.preview, exact: true, component: LetterRequestPage,
    isComplete: sess => !!sess.letterRequest },
  { path: Routes.loc.confirmation, exact: true, component: LetterConfirmation }
];

export const RedirectToLatestLetterOfComplaintStep = () =>
  <RedirectToLatestStep steps={letterOfComplaintSteps} />;

export default function LetterOfComplaintRoutes(): JSX.Element {
  return (
    <>
      <Route path={Routes.loc.latestStep} exact component={RedirectToLatestLetterOfComplaintStep} />
      <RouteProgressBar label="Letter of Complaint" hideBar steps={letterOfComplaintSteps} />
    </>
  );
}
