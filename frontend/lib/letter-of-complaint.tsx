import React from 'react';
import Page from './page';
import { WhyMailALetterOfComplaint, WelcomeFragment } from './letter-of-complaint-common';
import { Link, Switch, Route } from 'react-router-dom';
import Routes from './routes';
import { IssuesRoutes } from './pages/issues';


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
    <Switch>
      <Route path={Routes.loc.home} exact component={Welcome} />
      <Route path={Routes.loc.whyMail} exact component={WhyMail} />
      <Route path={Routes.loc.issues.prefix} component={IssuesRoutes} />
    </Switch>
  );
}
