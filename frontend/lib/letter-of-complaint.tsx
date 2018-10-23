import React from 'react';
import Page from './page';
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
        <h2 className="title">Let's start your letter!</h2>
        <p>
          We're going to help you create a customized Letter of Complaint that highlights the issues in your apartment that need repair. <strong>This will take about 5 minutes.</strong>
        </p>
        <ol className="has-text-left">
          <li>First, conduct a self-inspection of your apartment to document all the issues that need repair.</li>
          <li>Review your Letter of Complaint and JustFix.nyc will mail it via Certified Mail.</li>
        </ol>
        <CenteredPrimaryButtonLink to={Routes.loc.issues.home}>
          Add issues
        </CenteredPrimaryButtonLink>
        <br/>
        <h2 className="title">What are the benefits of mailing a Certified Letter of Complaint?</h2>
        <p>
          Your landlord is responsible for keeping your apartment and the building safe and livable at all times. This is called the <strong>Warranty of Habitability</strong>.
        </p>
        <p>
          If your landlord has been unresponsive to your requests to make repairs, a letter is a great tactic! By mailing a Letter of Complaint via Certified mail, you will have an official record of the requests you’ve made to your landlord. <strong>It is also good to have this letter as evidence for a future legal action.</strong>
        </p>
      </div>
    </Page>
  );
}

export const letterOfComplaintSteps: SessionProgressStepRoute[] = [
  { path: Routes.loc.home, exact: true, component: Welcome },
  { path: Routes.loc.issues.prefix, component: IssuesRoutes },
  { path: Routes.loc.accessDates, exact: true, component: AccessDatesPage },
  { path: Routes.loc.yourLandlord, exact: true, component: LandlordDetailsPage },
  { path: Routes.loc.preview, component: LetterRequestPage,
    isComplete: sess => !!sess.letterRequest },
  { path: Routes.loc.confirmation, exact: true, component: LetterConfirmation }
];

export const RedirectToLatestLetterOfComplaintStep = () =>
  <RedirectToLatestStep steps={letterOfComplaintSteps} />;

export default function LetterOfComplaintRoutes(): JSX.Element {
  return (
    <>
      <Route path={Routes.loc.latestStep} exact component={RedirectToLatestLetterOfComplaintStep} />
      <RouteProgressBar label="Letter of Complaint" steps={letterOfComplaintSteps} />
    </>
  );
}
