import React from 'react';

import Routes from "./routes";
import Page from "./page";
import { Route, Switch, Link } from 'react-router-dom';
import { CenteredPrimaryButtonLink, BackButton } from './buttons';
import { IssuesRoutes } from './pages/issue-pages';
import { SessionProgressStepRoute } from './progress-redirection';
import { RouteProgressBar } from './progress-bar';
import { withAppContext, AppContextType } from './app-context';
import { AllSessionInfo_landlordDetails } from './queries/AllSessionInfo';

const onboardingForHPActionRoute = Routes.hp.onboarding.latestStep;

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

const LandlordDetails = (props: { details: AllSessionInfo_landlordDetails }) => (
  <>
    <p>This is your landlord’s information as registered with the <b>NYC Department of Housing and Preservation (HPD)</b>. This may be different than where you send your rent checks.</p>
    <dl>
      <dt>Name</dt>
      <dd>{props.details.name}</dd>
      <dt>Address</dt>
      <dd>{props.details.address}</dd>
    </dl>
    <p>We'll use these details to automatically fill out your HP Action forms!</p>
  </>
);

const HPActionYourLandlord = withAppContext((props: AppContextType) => {
  const details = props.session.landlordDetails;

  return (
    <Page title="Your landlord" className="content">
      <h1 className="title is-4">Your landlord</h1>
      {details && details.isLookedUp && details.name && details.address
        ? <LandlordDetails details={details} />
        : <p>We were unable to retrieve information from the <b>NYC Department of Housing and Preservation (HPD)</b> about your landlord, so you will need to fill out the information yourself once we give you the forms.</p>}
      <div className="buttons jf-two-buttons">
        <BackButton to={Routes.hp.issues.home} label="Back" />
        <Link to={Routes.hp.preview} className="button is-primary is-medium">Next</Link>
      </div>
    </Page>
  );
});

const HPActionPreview = () => {
  return <p>TODO: Implement this!</p>;
};

const stepsToFillOut: SessionProgressStepRoute[] = [
  { path: Routes.hp.issues.prefix, component: HPActionIssuesRoutes },
  { path: Routes.hp.yourLandlord, exact: true, component: HPActionYourLandlord},
  { path: Routes.hp.preview, exact: true, component: HPActionPreview}
];

export default function HPActionRoutes(): JSX.Element {
  return (
    <Switch>
      <Route path={Routes.hp.preOnboarding} exact component={HPActionPreOnboarding} />
      <Route path={Routes.hp.postOnboarding} exact component={HPActionPostOnboarding} />
      <Route render={() => (
        <RouteProgressBar label="HP Action" steps={stepsToFillOut} />
      )} />
    </Switch>
  );
}
