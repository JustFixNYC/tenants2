import React from 'react';
import Page from './page';
import { WhyMailALetterOfComplaint, WelcomeFragment } from './letter-of-complaint-common';
import { Link, Route } from 'react-router-dom';
import Routes from './routes';
import { IssuesRoutes } from './pages/issue-pages';
import AccessDatesPage from './pages/access-dates';
import LandlordDetailsPage from './pages/landlord-details';
import { RouteProgressBar } from './progress-bar';
import LetterRequestPage from './pages/letter-request';
import LetterConfirmation from './pages/loc-confirmation';


export function Welcome(): JSX.Element {
  return (
    <Page title="Welcome!">
      <div className="content">
        <WelcomeFragment />
      </div>
    </Page>
  );
}

export function WhyMail(): JSX.Element {
  return (
    <Page title="Why mail a certified letter of complaint?">
      <div className="content">
        <WhyMailALetterOfComplaint heading="h1" />
        <Link className="button is-primary" to={Routes.loc.issues.home}>Add issues</Link>
      </div>
    </Page>
  );
}

export default function LetterOfComplaintRoutes(): JSX.Element {
  return (
    <RouteProgressBar label="Letter of Complaint">
      <Route path={Routes.loc.home} exact component={Welcome} />
      <Route path={Routes.loc.whyMail} exact component={WhyMail} />
      <Route path={Routes.loc.issues.prefix} component={IssuesRoutes} />
      <Route path={Routes.loc.accessDates} exact component={AccessDatesPage} />
      <Route path={Routes.loc.yourLandlord} exact component={LandlordDetailsPage} />
      <Route path={Routes.loc.preview} exact component={LetterRequestPage} />
      <Route path={Routes.loc.confirmation} exact component={LetterConfirmation} />
    </RouteProgressBar>
  );
}
