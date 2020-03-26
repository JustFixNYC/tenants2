import React, { useContext } from 'react';
import Routes, { getSignupIntentOnboardingInfo } from "./routes";
import { ProgressRoutesProps, buildProgressRoutesComponent } from './progress-routes';
import { HPUploadStatus, OnboardingInfoSignupIntent } from "./queries/globalTypes";
import Page from './page';
import { GetStartedButton } from './get-started-button';
import { AppContext } from './app-context';
import { TenantChildren } from './pages/hp-action-tenant-children';
import { isNotSuingForRepairs } from './hp-action-util';
import { MiddleProgressStep, ProgressStepProps } from './progress-step-route';
import { BackButton, ProgressButtons } from './buttons';
import { Link } from 'react-router-dom';
import { AccessForInspection } from './pages/hp-action-access-for-inspection';
import { createHPActionPreviousAttempts } from './pages/hp-action-previous-attempts';
import { HPActionYourLandlord } from './pages/hp-action-your-landlord';
import { GeneratePDFForm, ShowHPUploadStatus } from './pages/hp-action-generate-pdf';
import { assertNotNull } from './util';
import { PdfLink } from './pdf-link';
import { BigList } from './big-list';
import { OutboundLink } from './google-analytics';

const onboardingForHPActionRoute = () => getSignupIntentOnboardingInfo(OnboardingInfoSignupIntent.EHP).onboarding.latestStep;

const Disclaimer: React.FC<{}> = () => (
  <div className="notification is-warning">
    <p>Due to the COVID-19 pandemic, Housing Courts in New York City are only accepting cases for the following:</p>
    <ul>
      <li>Repairs for heat</li>
      <li>Repairs for hot water</li>
    </ul>
  </div>
);

function EmergencyHPActionSplash(): JSX.Element {
  const {efnycOrigin} = useContext(AppContext).server;

  return (
    <Page title="Sue your landlord for Repairs through an Emergency HP Action proceeding" withHeading="big" className="content">
      <Disclaimer />
      <p>Welcome to JustFix.nyc! This website will guide you through the process of starting an <strong>Emergency HP Action</strong> proceeding.</p>
      <p>An <strong>Emergency HP Action</strong> is a legal case you can bring against your landlord for failing to make repairs and not providing essential services.</p>
      <p><em>This service is free and secure.</em></p>
      <p>Are you facing an eviction? It is important for you to get help ASAP. Visit <a href={efnycOrigin} target="_blank" rel="noreferrer noopener">EFNYC</a> to see if you qualify for a free lawyer.</p>
      <GetStartedButton to={onboardingForHPActionRoute()} intent={OnboardingInfoSignupIntent.EHP} pageType="splash">
        Start my case
      </GetStartedButton>
    </Page>
  );
}

const EmergencyHPActionWelcome = () => {
  const {session} = useContext(AppContext);
  const title = `Welcome, ${session.firstName}! Let's start your HP Action paperwork.`;

  return (
    <Page title={title} withHeading="big" className="content">
      <Disclaimer />
      <p>
        An <strong>Emergency HP (Housing Part) Action</strong> is a legal case you can bring against your landlord for failing to make repairs, and not providing essential services. Here is how it works:
      </p>
      <ol className="has-text-left">
        <li>You answer a few questions here about your housing situation and we email the forms you need to start your case to your email and your borough's Housing Court.</li>
        <li>You will be assigned a lawyer who will help you throughout your case.</li>
        <li>An inspector from Housing and Preservation and Development (HPD) will come to your house to verify the issue(s). Your lawyer will help you arrange a time that is convenient for you and give you the details you will need.</li>
        <li>The court hearing will happen through a video call so that you do not have to go to the courthouse in-person. Your lawyer will give you all of the details and will guide you every step of the way.</li>
      </ol>
      <div className="notification is-warning">
        <p>Due to the COVID-19 pandemic, Housing Courts in New York City will be conducting hearings via video conferencing. Tenants will not be required to go to Housing Court in person.</p>
      </div>
      <GetStartedButton to={Routes.locale.ehp.sue} intent={OnboardingInfoSignupIntent.HP} pageType="welcome">
        Get started
      </GetStartedButton>
    </Page>
  );
};

const Sue = MiddleProgressStep(props => (
  <Page title="What type of problems are you experiencing?" withHeading>
    <p><strong>TODO:</strong> Add checkboxes here!</p>
    <div className="buttons jf-two-buttons">
      <BackButton to={props.prevStep} />
      <Link to={props.nextStep} className="button is-primary is-medium">Next</Link>
    </div>
  </Page>
));

const YourLandlord = (props: ProgressStepProps) => (
  <HPActionYourLandlord {...props} renderProgressButtons={props => (
    <GeneratePDFForm toWaitForUpload={Routes.locale.ehp.waitForUpload}>
      {(ctx) =>
        <ProgressButtons back={assertNotNull(props.prevStep)} isLoading={ctx.isLoading}
         nextLabel="Generate forms" />
      }
    </GeneratePDFForm>
  )} />
);

const UploadStatus = () => (
  <ShowHPUploadStatus
    toWaitForUpload={Routes.locale.ehp.waitForUpload}
    toSuccess={Routes.locale.ehp.reviewForms}
    toNotStarted={Routes.locale.ehp.latestStep}
  />
);

const ReviewForms = () => {
  const {session} = useContext(AppContext);
  const href = session.latestHpActionPdfUrl;

  return (
    <Page title="Your HP Action packet is ready!" withHeading="big" className="content">
      <p>The button below will download your Emergency HP Action forms for you to review.</p>
      {href && <PdfLink href={href} label="Download HP Action forms" />}
      <p>
        If anything looks amiss, you can <Link to={Routes.locale.ehp.yourLandlord}>go back</Link> and make changes.
      </p>
      <p><strong>TODO:</strong> Start the e-signing process. For now, <Link to={Routes.locale.ehp.confirmation}>here's a link</Link> to what happens after the e-signing is completed.</p>
    </Page>
  );
};

const Confirmation: React.FC<{}> = () => {
  return (
    <Page title="Your HP Action forms have been sent to the court!" withHeading="big" className="content">
      <p>
        Your completed, signed HP Action paperwork have been emailed to you and your Housing Court.
      </p>
      <h2>What happens next?</h2>
      <BigList>
        <li>The Housing Court clerk will review your HP Action forms.</li>
        <li>The Housing Court will assign you a lawyer who will call you to coordinate at the phone number you provided.</li>
        <li>An inspector from Housing Preservation and Development (HPD) will come to your house to verify the issue(s). Your lawyer will help you arrange a time that is convenient for you and give you the details you will need.</li>
        <li>The court hearing will happen through a video call so that you do not have to go to the court house in-person. Your lawyer will give you all of the details and will guide you every step of the way.</li>
      </BigList>
      <h2>Want to read more about your rights?</h2>
      <ul>
        {/* TODO: This is currently duplicated from the HP action flow, we might want to create a reusable component out of it. */}
        <li><OutboundLink href="https://www.metcouncilonhousing.org/help-answers/getting-repairs/" target="_blank">Met Council on Housing</OutboundLink>
          {' '}(<OutboundLink href="https://www.metcouncilonhousing.org/help-answers/how-to-get-repairs-spanish/" target="_blank">en español</OutboundLink>)</li>
        <li><OutboundLink href="http://housingcourtanswers.org/answers/for-tenants/hp-actions-tenants/" target="_blank">Housing Court Answers</OutboundLink></li>
        <li><OutboundLink href="https://www.lawhelpny.org/nyc-housing-repairs" target="_blank">LawHelpNY</OutboundLink></li>
        <li><OutboundLink href="https://www.justfix.nyc/learn?utm_source=tenantplatform&utm_medium=hp" target="_blank">JustFix.nyc's Learning Center</OutboundLink></li>
      </ul>
    </Page>
  );
}

const PreviousAttempts = createHPActionPreviousAttempts(() => Routes.locale.ehp);

export const getEmergencyHPActionProgressRoutesProps = (): ProgressRoutesProps => ({
  toLatestStep: Routes.locale.ehp.latestStep,
  label: "Emergency HP Action",
  welcomeSteps: [{
    path: Routes.locale.ehp.splash, exact: true, component: EmergencyHPActionSplash,
    isComplete: (s) => !!s.phoneNumber
  }, {
    path: Routes.locale.ehp.welcome, exact: true, component: EmergencyHPActionWelcome
  }],
  stepsToFillOut: [
    { path: Routes.locale.ehp.sue, component: Sue },
    { path: Routes.locale.ehp.tenantChildren, component: TenantChildren,
      shouldBeSkipped: isNotSuingForRepairs },
    { path: Routes.locale.ehp.accessForInspection, component: AccessForInspection,
      shouldBeSkipped: isNotSuingForRepairs },
    { path: Routes.locale.ehp.prevAttempts, component: PreviousAttempts,
      shouldBeSkipped: isNotSuingForRepairs },
    { path: Routes.locale.ehp.yourLandlord, exact: true, component: YourLandlord,
      isComplete: (s) => s.hpActionUploadStatus !== HPUploadStatus.NOT_STARTED },
  ],
  confirmationSteps: [
    { path: Routes.locale.ehp.waitForUpload, exact: true, component: UploadStatus,
      isComplete: (s) => s.hpActionUploadStatus === HPUploadStatus.SUCCEEDED },
    { path: Routes.locale.ehp.reviewForms, exact: true, component: ReviewForms},
    { path: Routes.locale.ehp.confirmation, exact: true, component: Confirmation}
  ]
});

const EmergencyHPActionRoutes = buildProgressRoutesComponent(getEmergencyHPActionProgressRoutesProps);

export default EmergencyHPActionRoutes;
