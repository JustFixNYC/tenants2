import React from 'react';

import Routes from "./routes";
import Page from "./page";
import { OnboardingInfoSignupIntent } from './queries/globalTypes';
import { Route, Switch } from 'react-router-dom';
import { CenteredPrimaryButtonLink } from './buttons';
import { IssuesRoutes } from './pages/issue-pages';

const onboardingForHPActionRoute = Routes.onboarding.forIntent.create(OnboardingInfoSignupIntent.HP);

function HPActionPreOnboarding(): JSX.Element {
  return (
    <Page title="HP action landing page" className="content">
      <h1>HP action landing page</h1>
      <p>This page will eventually include information on why you should sign up with JustFix to start an HP action.</p>
      <CenteredPrimaryButtonLink className="is-large" to={onboardingForHPActionRoute}>
        Start my free HP action
      </CenteredPrimaryButtonLink>
    </Page>
  );
}

const HPActionPostOnboarding = () => {
  return (
    <Page title="Sue your landlord for repairs through an HP Action proceeding">
      <div className="content">
        <h1>Sue your landlord for repairs through an HP Action proceeding</h1>
        <p>
          An <strong>HP (Housing Part) Action</strong> is a legal case you can bring against your landlord for failing to make repairs, not providing essential services, or harassing you. Here is how it works:
        </p>
        <ol className="has-text-left">
          <li>Answer a few questions about your housing situation.</li>
          <li>We provide you with a pre-filled packet of all the paperwork you’ll need. 
.</li>
          <li><strong>Print out this packet and bring it to Housing Court.</strong> It will include instructions for <strong>filing in court</strong> and <strong>serving your landlord</strong>.
</li>
        </ol>
        <CenteredPrimaryButtonLink to={Routes.hp.issues.home}>
          Start my case
        </CenteredPrimaryButtonLink>
        <br/>
        <p>
          <strong>You do not need a lawyer to be successful in an HP Action.</strong> You must be able to show the court that repairs are needed and what those repairs are. This includes photo evidence of the issues, HPD inspection reports, and communication with your landlord.
        </p>
      </div>
    </Page>
  );
};

const HPActionIssuesRoutes = () => (
  <IssuesRoutes
    routes={Routes.hp.issues}
    toBack={Routes.hp.postOnboarding}
    toNext={Routes.hp.yourLandlord}
  />
);

export default function HPActionRoutes(): JSX.Element {
  return (
    <Switch>
      <Route path={Routes.hp.preOnboarding} exact component={HPActionPreOnboarding} />
      <Route path={Routes.hp.postOnboarding} exact component={HPActionPostOnboarding} />
      <Route path={Routes.hp.issues.prefix} component={HPActionIssuesRoutes} />
      <Route path={Routes.hp.yourLandlord} exact
             render={() => <Page title="TODO">TODO: Implement this!</Page>} />
    </Switch>
  );
}
