import React from 'react';

import Routes from "./routes";
import Page from "./page";
import { CenteredPrimaryButtonLink, BackButton, NextButton } from './buttons';
import { IssuesRoutes } from './pages/issue-pages';
import { withAppContext, AppContextType } from './app-context';
import { AllSessionInfo_landlordDetails } from './queries/AllSessionInfo';
import { SessionUpdatingFormSubmitter } from './forms';
import { GenerateHPActionPDF } from './queries/GenerateHPActionPDF';
import { PdfLink } from './pdf-link';
import { ProgressRoutesProps, buildProgressRoutesComponent } from './progress-routes';
import { OutboundLink } from './google-analytics';

const onboardingForHPActionRoute = Routes.hp.onboarding.latestStep;

function HPActionSplash(): JSX.Element {
  return (
    <Page title="HP action splash page" className="content">
      <h1>HP action splash page</h1>
      <p>This page will eventually include information on why you should sign up with JustFix to start an HP action.</p>
      <CenteredPrimaryButtonLink className="is-large" to={onboardingForHPActionRoute}>
        Start my free HP action
      </CenteredPrimaryButtonLink>
    </Page>
  );
}

const HPActionWelcome = () => {
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
      <SessionUpdatingFormSubmitter
        mutation={GenerateHPActionPDF}
        initialState={{}}
        onSuccessRedirect={Routes.hp.confirmation}
      >
        {(ctx) =>
          <div className="buttons jf-two-buttons">
            <BackButton to={Routes.hp.issues.home} label="Back" />
            <NextButton isLoading={ctx.isLoading} label="Generate forms"/>
          </div>
        }
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});

const HPActionConfirmation = withAppContext((props: AppContextType) => {
  const href = props.session.latestHpActionPdfUrl;

  return (
    <Page title="Your HP Action packet has been created!!" className="content">
      <h1 className="title is-4">Your HP Action packet has been created!</h1>
      <p>Here is all of your HP Action paperwork, including instructions:</p>
      {href && <PdfLink href={href} label="Download HP Action packet" />}
      <h2>What happens next?</h2>
      <ol>
        <li><strong>Print out this packet and bring it to Housing Court.</strong> Do not sign any of the documents until you bring them to court.</li>
        <li>Once you arrive at court, <strong>go to the clerk’s office to file these papers</strong>. They will assign you an Index Number and various dates.</li>
        <li>After you file your papers, you will need to <strong>serve your landlord and/or management company</strong>. This paperwork is also included in your packet.</li>
      </ol>
      <h2>Want to read more about your rights?</h2>
      <ul>
        <li><OutboundLink href="http://housingcourtanswers.org/answers/for-tenants/hp-actions-tenants/" target="_blank">Housing Court Answers</OutboundLink></li>
        <li><OutboundLink href="https://www.lawhelpny.org/nyc-housing-repairs" target="_blank">LawHelpNY</OutboundLink></li>
        <li><OutboundLink href="http://metcouncilonhousing.org/help_and_answers/how_to_get_repairs" target="_blank">Met Council on Housing</OutboundLink>
          {' '}(<OutboundLink href="http://metcouncilonhousing.org/help_and_answers/how_to_get_repairs_spanish" target="_blank">en español</OutboundLink>)</li>
      </ul>
    </Page>
  );
});

export const HPActionProgressRoutesProps: ProgressRoutesProps = {
  toLatestStep: Routes.hp.latestStep,
  label: "HP Action",
  welcomeSteps: [{
    path: Routes.hp.splash,
    exact: true,
    component: HPActionSplash,
    isComplete: (s) => !!s.phoneNumber
  }, {
    path: Routes.hp.welcome,
    exact: true,
    component: HPActionWelcome
  }],
  stepsToFillOut: [
    { path: Routes.hp.issues.prefix, component: HPActionIssuesRoutes },
    { path: Routes.hp.yourLandlord, exact: true, component: HPActionYourLandlord,
      isComplete: (s) => !!s.latestHpActionPdfUrl },
  ],
  confirmationSteps: [
    { path: Routes.hp.confirmation, exact: true, component: HPActionConfirmation}
  ]
};

const HPActionRoutes = buildProgressRoutesComponent(HPActionProgressRoutesProps);

export default HPActionRoutes;
