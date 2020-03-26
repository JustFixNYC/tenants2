import React, { useContext } from 'react';
import Routes from "./routes";
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

const onboardingForHPActionRoute = () => Routes.locale.ehp.onboarding.latestStep;

function EmergencyHPActionSplash(): JSX.Element {
  return (
    <Page title="Sue your landlord for Repairs through an Emergency HP Action proceeding" withHeading="big" className="content">
      <p>Welcome to JustFix.nyc! This website will guide you through the process of starting an <strong>Emergency HP Action</strong> proceeding.</p>
      <p>An <strong>Emergency HP Action</strong> is a legal case you can bring against your landlord for failing to make repairs, not providing essential services, or harassing you.</p>
      <p><em>This service is free and secure.</em></p>
      <GetStartedButton to={onboardingForHPActionRoute()} intent={OnboardingInfoSignupIntent.HP} pageType="splash">
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
      <p>
        An <strong>Emergency HP (Housing Part) Action</strong> is a legal case you can bring against your landlord for failing to make repairs, not providing essential services, or harassing you. Here is how it works:
      </p>
      <ol className="has-text-left">
        <li>You answer a few questions here about your housing situation.</li>
        <li>Magic happens.</li>
      </ol>
      <GetStartedButton to={Routes.locale.ehp.sue} intent={OnboardingInfoSignupIntent.HP} pageType="welcome">
        Get started
      </GetStartedButton>
    </Page>
  );
};

const Sue = MiddleProgressStep(props => (
  <Page title="Sue your landlord">
    <p>TODO FILL THIS OUT</p>
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
    toSuccess={Routes.locale.ehp.confirmation}
    toNotStarted={Routes.locale.ehp.latestStep}
  />
);

const HPActionConfirmation = () => {
  const {session} = useContext(AppContext);
  const href = session.latestHpActionPdfUrl;

  return (
    <Page title="Your HP Action packet is ready!" withHeading="big" className="content">
      <p>Here is all of your HP Action paperwork.</p>
      {href && <PdfLink href={href} label="Download HP Action packet" />}
      <p>TODO start e-signing process!</p>
    </Page>
  );
};

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
    { path: Routes.locale.ehp.confirmation, exact: true, component: HPActionConfirmation}
  ]
});

const EmergencyHPActionRoutes = buildProgressRoutesComponent(getEmergencyHPActionProgressRoutesProps);

export default EmergencyHPActionRoutes;
