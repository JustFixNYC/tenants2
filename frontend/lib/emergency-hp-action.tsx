import React, { useContext } from 'react';
import Routes, { getSignupIntentOnboardingInfo } from "./routes";
import { ProgressRoutesProps, buildProgressRoutesComponent } from './progress-routes';
import { HPUploadStatus, OnboardingInfoSignupIntent, HPDocusignStatus } from "./queries/globalTypes";
import Page from './page';
import { GetStartedButton } from './get-started-button';
import { AppContext } from './app-context';
import { TenantChildren } from './pages/hp-action-tenant-children';
import { isNotSuingForRepairs } from './hp-action-util';
import { MiddleProgressStep, ProgressStepProps } from './progress-step-route';
import { ProgressButtons, BackButton, NextButton } from './buttons';
import { Link } from 'react-router-dom';
import { EhpAccessForInspection } from './pages/hp-action-access-for-inspection';
import { createHPActionPreviousAttempts } from './pages/hp-action-previous-attempts';
import { HPActionYourLandlord } from './pages/hp-action-your-landlord';
import { GeneratePDFForm, ShowHPUploadStatus } from './pages/hp-action-generate-pdf';
import { assertNotNull } from './util';
import { PdfLink } from './pdf-link';
import { BigList } from './big-list';
import { OutboundLink } from './google-analytics';
import { SessionUpdatingFormSubmitter } from './session-updating-form-submitter';
import { EmergencyHpaIssuesMutation, BlankCustomHomeIssuesCustomIssueFormFormSetInput } from './queries/EmergencyHpaIssuesMutation';
import { HiddenFormField, MultiCheckboxFormField, TextualFormField } from './form-fields';
import { LegacyFormSubmitter } from './legacy-form-submitter';
import { BeginDocusignMutation } from './queries/BeginDocusignMutation';
import { performHardOrSoftRedirect } from './pages/login-page';
import { MoratoriumWarning, CovidEhpDisclaimer } from './covid-banners';
import { StaticImage } from './static-image';
import { VerifyEmailMiddleProgressStep } from './pages/verify-email';
import { customIssuesForArea } from './issues';
import { Formset } from './formset';
import { CUSTOM_ISSUE_MAX_LENGTH, MAX_CUSTOM_ISSUES_PER_AREA } from '../../common-data/issue-validation.json';
import { FormsetItem, formsetItemProps } from './formset-item';
import { TextualFieldWithCharsRemaining } from './chars-remaining';
import { SessionStepBuilder } from './session-step-builder';
import { OptionalLandlordDetailsMutation } from './queries/OptionalLandlordDetailsMutation';
import { PhoneNumberFormField } from './phone-number-form-field';
import { isUserNycha } from './nycha';
import { ModalLink, Modal, BackOrUpOneDirLevel } from './modal';
import { CenteredButtons } from './centered-buttons';
import { EMERGENCY_HPA_ISSUE_SET, getEmergencyHPAIssueChoices } from './emergency-hp-action-issues';

const checkCircleSvg = require('./svg/check-circle-solid.svg') as JSX.Element;


const HP_ICON = "frontend/img/hp-action.svg";

const onboardingForHPActionRoute = () => getSignupIntentOnboardingInfo(OnboardingInfoSignupIntent.EHP).onboarding.latestStep;


function EmergencyHPActionSplash(): JSX.Element {
  return (
    <Page title="Sue your landlord for Repairs through an Emergency HP Action proceeding">
        <section className="hero is-light">
          <div className="hero-body">
            <div className="content has-text-centered">
              <div className="is-inline-block jf-hp-icon">
                <StaticImage ratio="is-square" src={HP_ICON} alt="" />
              </div>
              <h1 className="title is-spaced">
                Sue your landlord for Repairs through an Emergency HP Action proceeding
              </h1>
            </div>
            <div className="columns is-centered">
              <div className="column is-four-fifths">
                <div className="content">
                  <p className="subtitle">
                    An Emergency HP Action is a legal case you can bring against your landlord for failing to make repairs or not providing essential services.
                    This service is free and secure.
                  </p>
                  <CovidEhpDisclaimer />
                  <GetStartedButton to={onboardingForHPActionRoute()} intent={OnboardingInfoSignupIntent.EHP} pageType="splash">
                    Start my case
                  </GetStartedButton>
                  <div className="content has-text-centered">
                    <p className="jf-secondary-cta has-text-weight-bold">Would you prefer to work with a lawyer to start your case?
                     <br />Call the Housing Court Answers hotline at <a href="tel:1-212-962-4795">212-962-4795</a> Monday to Friday, 9am to 5pm.</p>
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
  const title = `Welcome, ${session.firstName}! Let's start your Emergency HP Action paperwork.`;

  return (
    <Page title={title} withHeading="big" className="content">
      <CovidEhpDisclaimer />
      <p>
        An <strong>Emergency HP (Housing Part) Action</strong> is a legal case you can bring against your landlord for failing to make repairs or not providing essential services. Here is how it works:
      </p>
      <BigList>
        <li>Answer a few questions here about your housing situation and we will email your answers to your Borough’s Housing Court. You will also be emailed a copy of the forms.</li>
        <li>The Housing Court will assign you a lawyer who will call you to coordinate at the phone number you provided.</li>
        <li>An inspector from Housing Preservation and Development (HPD) will come to your apartment to verify the issue(s). Your lawyer will help you arrange a time that is convenient for you and give you the details you will need.</li>
        <li>The court hearing will happen through a video call so that <strong>you do not have to go to the Courthouse in-person</strong>. Your lawyer will give you all of the details and will guide you every step of the way.</li>
      </BigList>
        <br />
      <GetStartedButton to={Routes.locale.ehp.sue} intent={OnboardingInfoSignupIntent.EHP} pageType="welcome">
        Get started
      </GetStartedButton>
      <MoratoriumWarning />
    </Page>
  );
};


const Sue = MiddleProgressStep(props => (
  <Page title="What type of problems are you experiencing?" withHeading className="content">
    <SessionUpdatingFormSubmitter
      mutation={EmergencyHpaIssuesMutation}
      initialState={(session) => ({
        issues: session.issues.filter(issue => EMERGENCY_HPA_ISSUE_SET.has(issue)),
        customHomeIssues: customIssuesForArea('HOME', session.customIssuesV2 || []).map(ci => ({
          description: ci.description,
          id: ci.id,
          DELETE: false
        }))
      })}
      onSuccessRedirect={props.nextStep}
    >
      {(ctx) => <>
        <MultiCheckboxFormField
          {...ctx.fieldPropsFor('issues')}
          choices={getEmergencyHPAIssueChoices()}
          label="Select all issues that apply to your housing situation"
        />
        <br/>
        <p>Don't see your issues listed? You can add up to {MAX_CUSTOM_ISSUES_PER_AREA} additional emergency home issues below.</p>
        <br/>
        <Formset {...ctx.formsetPropsFor('customHomeIssues')}
                 maxNum={MAX_CUSTOM_ISSUES_PER_AREA}
                 extra={MAX_CUSTOM_ISSUES_PER_AREA}
                 emptyForm={BlankCustomHomeIssuesCustomIssueFormFormSetInput}>
          {(ciCtx, i) => (
            <FormsetItem {...formsetItemProps(ciCtx)}>
              <TextualFieldWithCharsRemaining {...ciCtx.fieldPropsFor('description')}
                maxLength={CUSTOM_ISSUE_MAX_LENGTH}
                fieldProps={{style: {maxWidth: `${CUSTOM_ISSUE_MAX_LENGTH}em`}}}
                label={`Custom home issue #${i + 1} (optional)`} />
            </FormsetItem>
          )}
        </Formset>
        <ProgressButtons back={props.prevStep} isLoading={ctx.isLoading} />
      </>}
    </SessionUpdatingFormSubmitter>
  </Page>
));

const PrepareToGeneratePDF = MiddleProgressStep(props => (
  <Page title="It's time to prepare your forms" withHeading className="content">
    <p>Next, we're going to prepare your Emergency HP Action paperwork for you to review.</p>
    <p>This will take a little while, so sit tight.</p>
    <GeneratePDFForm toWaitForUpload={Routes.locale.ehp.waitForUpload} kind="EMERGENCY">
      {(ctx) =>
        <ProgressButtons back={props.prevStep} isLoading={ctx.isLoading}
          nextLabel="Prepare forms" />
      }
    </GeneratePDFForm>
  </Page>
));

const stepBuilder = new SessionStepBuilder(sess => sess);

const YourLandlordOptionalDetails = stepBuilder.createStep({
  title: "Optional landlord contact information",
  mutation: OptionalLandlordDetailsMutation,
  toFormInput: sess => ({
    email: sess.data.landlordDetails?.email || '',
    phoneNumber: sess.data.landlordDetails?.phoneNumber || '',
  }),
  renderIntro: () => <>
    <p>Do you have your landlord's email or phone number? If so, please provide it below.</p>
    <p>Your lawyer will use this information to contact your landlord and move your case along faster.</p>
  </>,
  renderForm: ctx => <>
    <TextualFormField type="email" {...ctx.fieldPropsFor('email')} label="Landlord email (highly recommended)" />
    <PhoneNumberFormField {...ctx.fieldPropsFor('phoneNumber')} label="Landlord phone number (highly recommended)" />
  </>
});

const UploadStatus = () => (
  <ShowHPUploadStatus
    kind="EMERGENCY"
    toWaitForUpload={Routes.locale.ehp.waitForUpload}
    toSuccess={Routes.locale.ehp.reviewForms}
    toNotStarted={Routes.locale.ehp.latestStep}
  />
);

const SignModal: React.FC<{
  nextUrl: string,
}> = ({nextUrl}) => {
  return (
    <Modal title="Sending you to DocuSign to sign your forms" withHeading onCloseGoTo={BackOrUpOneDirLevel} render={modalCtx => <>
      <p>You're now going to be taken to the website DocuSign to sign your forms.</p>
      <p>This is the final step in the process of filing your HP Action paperwork.</p>
      <LegacyFormSubmitter
        mutation={BeginDocusignMutation}
        initialState={{nextUrl}}
        onSuccessRedirect={(output, input) => assertNotNull(output.redirectUrl)}
        performRedirect={performHardOrSoftRedirect}
      >
        {ctx => <>
          <HiddenFormField {...ctx.fieldPropsFor('nextUrl')} />
          <CenteredButtons>
            <NextButton isLoading={ctx.isLoading} buttonClass="is-success"
                        label="Sign my forms" />
            <Link {...modalCtx.getLinkCloseProps()} className="button is-text">Go back</Link>
          </CenteredButtons>
        </>}
      </LegacyFormSubmitter>
    </>} />
  );
};

const ReviewForms: React.FC<ProgressStepProps> = (props) => {
  const {session} = useContext(AppContext);
  const href = session.latestEmergencyHpActionPdfUrl && `${session.latestEmergencyHpActionPdfUrl}`;
  const prevStep = assertNotNull(props.prevStep);
  const nextUrl = Routes.locale.ehp.latestStep;

  return (
    <Page title="You're almost there!" withHeading="big" className="content">
      <p>Please review your Emergency HP Action forms to make sure everything is correct. If anything looks wrong, you can <Link to={prevStep}>go back</Link> and make changes now.</p>
      {href && <PdfLink href={href} label="Preview forms" />}
      <p>
        From here, you'll sign your forms electronically and we'll immediately send them to the courts for you.
      </p>
      <div className="buttons jf-two-buttons jf-two-buttons--vertical">
        <BackButton to={prevStep} />
        <ModalLink to={Routes.locale.ehp.reviewFormsSignModal}
                   className="button is-primary is-medium"
                   render={() => <SignModal nextUrl={nextUrl} />}>
          My forms look good to me!
        </ModalLink>
      </div>
    </Page>
  );
};

const Confirmation: React.FC<{}> = () => {
  const title = "Your Emergency HP Action forms have been sent to the court!";
  return (
    <Page title={title} className="content">
      <h1 className="jf-heading-with-icon"><i className="has-text-success">{checkCircleSvg}</i><span>{title}</span></h1>
      <p>
        Your completed, signed Emergency HP Action forms have been emailed to you and your Housing Court.
      </p>
      <h2>What happens next?</h2>
      <BigList>
        <li>The Housing Court clerk will review your Emergency HP Action forms.</li>
        <li>The Housing Court will assign you a lawyer who will call you to coordinate at the phone number you provided.</li>
        <li>An inspector from Housing Preservation and Development (HPD) will come to your apartment to verify the issue(s). Your lawyer will help you arrange a time that is convenient for you and give you the details you will need.</li>
        <li>The court hearing will happen through a video call so that <strong>you do not have to go to the Courthouse in-person</strong>. Your lawyer will give you all of the details and will guide you every step of the way.</li>
      </BigList>
      <h2>Want to read more about your rights?</h2>
      <ul>
        {/* TODO: This is currently duplicated from the HP action flow, we might want to create a reusable component out of it. */}
        <li><OutboundLink href="https://www.metcouncilonhousing.org/help-answers/getting-repairs/" target="_blank">Met Council on Housing</OutboundLink>
          {' '}(<OutboundLink href="https://www.metcouncilonhousing.org/help-answers/how-to-get-repairs-spanish/" target="_blank">también en español</OutboundLink>)</li>
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
    { path: Routes.locale.ehp.accessForInspection, component: EhpAccessForInspection,
      shouldBeSkipped: isNotSuingForRepairs },
    { path: Routes.locale.ehp.prevAttempts, component: PreviousAttempts,
      shouldBeSkipped: s => isNotSuingForRepairs(s) || isUserNycha(s) },
    { path: Routes.locale.ehp.yourLandlord, exact: true, component: HPActionYourLandlord },
    { path: Routes.locale.ehp.yourLandlordOptionalDetails, exact: true, component: YourLandlordOptionalDetails,
      shouldBeSkipped: isUserNycha },
    { path: Routes.locale.ehp.verifyEmail, exact: true, component: VerifyEmailMiddleProgressStep,
      shouldBeSkipped: (s) => !!s.isEmailVerified },
    { path: Routes.locale.ehp.prepare, exact: true, component: PrepareToGeneratePDF,
      neverGoBackTo: true,
      isComplete: (s) => s.emergencyHpActionUploadStatus !== HPUploadStatus.NOT_STARTED },
  ],
  confirmationSteps: [
    { path: Routes.locale.ehp.waitForUpload, exact: true, component: UploadStatus,
      neverGoBackTo: true,
      isComplete: (s) => s.emergencyHpActionUploadStatus === HPUploadStatus.SUCCEEDED },
    { path: Routes.locale.ehp.reviewForms, component: ReviewForms, 
      isComplete: (s) => s.emergencyHpActionSigningStatus === HPDocusignStatus.SIGNED },
    { path: Routes.locale.ehp.confirmation, exact: true, component: Confirmation}
  ]
});

const EmergencyHPActionRoutes = buildProgressRoutesComponent(getEmergencyHPActionProgressRoutesProps);

export default EmergencyHPActionRoutes;
