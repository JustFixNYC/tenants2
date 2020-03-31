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
import { ProgressButtons } from './buttons';
import { Link } from 'react-router-dom';
import { AccessForInspection } from './pages/hp-action-access-for-inspection';
import { createHPActionPreviousAttempts } from './pages/hp-action-previous-attempts';
import { HPActionYourLandlord } from './pages/hp-action-your-landlord';
import { GeneratePDFForm, ShowHPUploadStatus } from './pages/hp-action-generate-pdf';
import { assertNotNull } from './util';
import { PdfLink } from './pdf-link';
import { BigList } from './big-list';
import { OutboundLink } from './google-analytics';
import { SessionUpdatingFormSubmitter } from './session-updating-form-submitter';
import { EmergencyHpaIssuesMutation } from './queries/EmergencyHpaIssuesMutation';
import { HiddenFormField, MultiCheckboxFormField } from './form-fields';
import { LegacyFormSubmitter } from './legacy-form-submitter';
import { BeginDocusignMutation } from './queries/BeginDocusignMutation';
import { performHardOrSoftRedirect } from './pages/login-page';
import EMERGENCY_HPA_ISSUE_LIST from '../../common-data/emergency-hpa-issue-list.json';
import { DjangoChoices } from './common-data';
import { getIssueChoiceLabels, IssueChoice } from '../../common-data/issue-choices';
import { MoratoriumWarning, CovidEhpDisclaimer } from './covid-banners';
import { StaticImage } from './static-image';
import { VerifyEmailMiddleProgressStep } from './pages/verify-email';

const EMERGENCY_HPA_ISSUE_SET = new Set(EMERGENCY_HPA_ISSUE_LIST);

const HP_ICON = "frontend/img/hp-action.svg";

const onboardingForHPActionRoute = () => getSignupIntentOnboardingInfo(OnboardingInfoSignupIntent.EHP).onboarding.latestStep;


function EmergencyHPActionSplash(): JSX.Element {
  return (
    <Page title="Sue your landlord for Repairs and/or Harassment through an HP Action proceeding">
        <section className="hero is-light">
          <div className="hero-body">
            <div className="content has-text-centered">
              <div className="is-inline-block jf-hp-icon">
                <StaticImage ratio="is-square" src={HP_ICON} alt="" />
              </div>
              <h1 className="title is-spaced">
                Sue your landlord for Repairs and/or Harassment through an HP Action proceeding
              </h1>
            </div>
            <div className="columns is-centered">
              <div className="column is-four-fifths">
                <div className="content">
                  <p className="subtitle">
                    An HP Action is a legal case you can bring against your landlord for failing to make repairs, not providing essential services, or harassing you.
                    This service is free, secure, and confidential.
                  </p>
                  <CovidEhpDisclaimer />
                  <GetStartedButton to={onboardingForHPActionRoute()} intent={OnboardingInfoSignupIntent.EHP} pageType="splash">
                    Start my case
                  </GetStartedButton>
                  <div className="content has-text-centered">
                    <p className="jf-secondary-cta">Already have an account? <Link to={Routes.locale.login}>Sign in!</Link></p>
                  </div>
                </div>
              </div>
            </div>
              <br />
            <MoratoriumWarning />
          </div>
        </section>
    </Page>
  );
}

const EmergencyHPActionWelcome = () => {
  const {session} = useContext(AppContext);
  const title = `Welcome, ${session.firstName}! Let's start your HP Action paperwork.`;

  return (
    <Page title={title} withHeading="big" className="content">
      <CovidEhpDisclaimer />
      <p>
        An <strong>HP (Housing Part) Action</strong> is a legal case you can bring against your landlord for failing to make repairs, not providing essential services, or harassing you. Here is how it works:
      </p>
      <BigList listClassName="is-light">
        <li>You answer a few questions here about your housing situation and we email the forms you need to start your case to your email and your Borough’s Housing Court.</li>
        <li>You will be assigned a Lawyer that will help you throughout your case.</li>
        <li>An inspector from the Department of Housing and Preservation (HPD) will come to your house to verify the issue(s). Your Lawyer will help you arrange a time that is convenient for you and give you the details you will need.</li>
        <li>The court hearing will happen through a video-call so that <strong>you do not have to go to the Courthouse in-person</strong>. Your Lawyer will give you all of the details and will guide you each step of the way.</li>
      </BigList>
        <br />
      <GetStartedButton to={Routes.locale.ehp.sue} intent={OnboardingInfoSignupIntent.EHP} pageType="welcome">
        Get started
      </GetStartedButton>
      <MoratoriumWarning />
    </Page>
  );
};

function getEmergencyHPAIssueChoices(): DjangoChoices {
  const labels = getIssueChoiceLabels();
  return EMERGENCY_HPA_ISSUE_LIST.map(issue => [issue, labels[issue as IssueChoice]]);
}

const Sue = MiddleProgressStep(props => (
  <Page title="What type of problems are you experiencing?" withHeading className="content">
    <SessionUpdatingFormSubmitter
      mutation={EmergencyHpaIssuesMutation}
      initialState={(session) => ({
        issues: session.issues.filter(issue => EMERGENCY_HPA_ISSUE_SET.has(issue)),
      })}
      onSuccessRedirect={props.nextStep}
    >
      {(ctx) => <>
        <MultiCheckboxFormField
          {...ctx.fieldPropsFor('issues')}
          choices={getEmergencyHPAIssueChoices()}
          label="Select all issues that apply to your housing situation"
        />
        <ProgressButtons back={props.prevStep} isLoading={ctx.isLoading} />
      </>}
    </SessionUpdatingFormSubmitter>
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

const ReviewForms: React.FC<ProgressStepProps> = (props) => {
  const {session} = useContext(AppContext);
  const href = session.latestHpActionPdfUrl && `${session.latestHpActionPdfUrl}?em=on`;
  const prevStep = Routes.locale.ehp.yourLandlord;
  const nextUrl = Routes.locale.ehp.confirmation;

  return (
    <Page title="Your HP Action packet is ready!" withHeading="big" className="content">
      <p>The button below will download your Emergency HP Action forms for you to review.</p>
      {href && <PdfLink href={href} label="Download HP Action forms" />}
      <p>
        If anything looks amiss, you can <Link to={prevStep}>go back</Link> and make changes.
      </p>
      <LegacyFormSubmitter
        mutation={BeginDocusignMutation}
        initialState={{nextUrl}}
        onSuccessRedirect={(output, input) => assertNotNull(output.redirectUrl)}
        performRedirect={performHardOrSoftRedirect}
      >
        {ctx => <>
          <HiddenFormField {...ctx.fieldPropsFor('nextUrl')} />
          <ProgressButtons back={prevStep} isLoading={ctx.isLoading}
                           nextLabel="Sign forms" />
        </>}
      </LegacyFormSubmitter>
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
    { path: Routes.locale.ehp.verifyEmail, exact: true, component: VerifyEmailMiddleProgressStep,
      shouldBeSkipped: (s) => !!s.isEmailVerified },
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
