import React from 'react';

import Routes, { getSignupIntentOnboardingInfo } from "./routes";
import Page from "./page";
import { ProgressButtons } from './buttons';
import { IssuesRoutes } from './pages/issue-pages';
import { withAppContext, AppContextType } from './app-context';
import { PdfLink } from './pdf-link';
import { ProgressRoutesProps, buildProgressRoutesComponent } from './progress-routes';
import { OutboundLink } from './google-analytics';
import { HPUploadStatus, OnboardingInfoSignupIntent } from './queries/globalTypes';
import { FeeWaiverMisc, FeeWaiverIncome, FeeWaiverExpenses, FeeWaiverPublicAssistance, FeeWaiverStart } from './pages/fee-waiver';
import { ProgressStepProps, MiddleProgressStep } from './progress-step-route';
import { assertNotNull } from './util';
import { TenantChildren } from './pages/hp-action-tenant-children';
import { createHPActionPreviousAttempts } from './pages/hp-action-previous-attempts';
import { CheckboxFormField } from './form-fields';
import { HpActionUrgentAndDangerousMutation } from './queries/HpActionUrgentAndDangerousMutation';
import { YesNoRadiosFormField } from './yes-no-radios-form-field';
import { SessionStepBuilder } from './session-step-builder';
import { HarassmentApartment, HarassmentExplain, HarassmentAllegations1, HarassmentAllegations2 } from './pages/hp-action-harassment';
import { HpActionSueMutation } from './queries/HpActionSueMutation';
import { HarassmentCaseHistory } from './pages/hp-action-case-history';
import { BigList } from './big-list';
import { EmailAttachmentForm } from './email-attachment';
import { EmailHpActionPdfMutation } from './queries/EmailHpActionPdfMutation';
import { GetStartedButton } from './get-started-button';
import { AccessForInspection } from './pages/hp-action-access-for-inspection';
import { HPActionYourLandlord } from './pages/hp-action-your-landlord';
import { GeneratePDFForm, ShowHPUploadStatus } from './pages/hp-action-generate-pdf';
import { isNotSuingForRepairs, isNotSuingForHarassment, hasFeeWaiverAnd } from './hp-action-util';
import { StaticImage } from './static-image';
import { MoratoriumWarning } from './covid-banners';

const HP_ICON = "frontend/img/hp-action.svg";

const onboardingForHPActionRoute = () => getSignupIntentOnboardingInfo(OnboardingInfoSignupIntent.HP).onboarding.latestStep;

// HP Cases currently being accepted in Housing Court amidst COVID-19 crisis
const acceptedCases = [
  "no heat", 
  "no hot water", 
  "no gas", 
  "mold", 
  "lead-based paint", 
  "no working toilet", 
  "vacate order issued"
];

function Disclaimer(): JSX.Element {
  const numCases = acceptedCases.length;
  const generateCaseList = (start: number, end: number) => 
    acceptedCases.map((caseType, i) => <li key={i}> {caseType} </li>).slice(start, end);
  return (
    <div className="notification is-warning">
      <p>Due to the covid-19 pandemic, Housing Courts in New York City are only accepting cases for the following:</p>
      <div className="is-hidden-tablet">
        {generateCaseList(0,numCases)}
      </div>
      <div className="columns is-mobile is-hidden-mobile">
        <div className="column is-one-third">
          {generateCaseList(0,Math.round(numCases / 2))}
        </div>
        <div className="column">
          {generateCaseList(Math.round(numCases / 2), numCases)}
        </div>
      </div>
    </div>
  );
}

function HPActionSplash(): JSX.Element {
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
                  <Disclaimer />
                  <GetStartedButton to={onboardingForHPActionRoute()} intent={OnboardingInfoSignupIntent.HP} pageType="splash">
                    Start my case
                  </GetStartedButton>
                </div>
              </div>
            </div>
            <MoratoriumWarning />
          </div>
        </section>
    </Page>
  );
}

const HPActionWelcome = withAppContext((props: AppContextType) => {
  const title = `Welcome, ${props.session.firstName}! Let's start your HP Action paperwork.`;

  return (
    <Page title={title} withHeading="big" className="content">
      <Disclaimer/>
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
      <GetStartedButton to={Routes.locale.hp.sue} intent={OnboardingInfoSignupIntent.HP} pageType="welcome">
        Get started
      </GetStartedButton>
      <MoratoriumWarning />
    </Page>
  );
});

const HPActionIssuesRoutes = MiddleProgressStep(props => (
  <IssuesRoutes
    routes={Routes.locale.hp.issues}
    introContent={<>This <strong>issue checklist</strong> will be the basis for your case.</>}
    toBack={props.prevStep}
    toNext={props.nextStep}
  />
));

const YourLandlord = (props: ProgressStepProps) => (
  <HPActionYourLandlord {...props} renderProgressButtons={props => (
    <GeneratePDFForm toWaitForUpload={Routes.locale.hp.waitForUpload}>
      {(ctx) =>
        <ProgressButtons back={assertNotNull(props.prevStep)} isLoading={ctx.isLoading}
          nextLabel="Generate forms" />
      }
    </GeneratePDFForm>
  )} />
);

const UploadStatus = () => (
  <ShowHPUploadStatus
    toWaitForUpload={Routes.locale.hp.waitForUpload}
    toSuccess={Routes.locale.hp.confirmation}
    toNotStarted={Routes.locale.hp.latestStep}
  />
);

const HPActionConfirmation = withAppContext((props: AppContextType) => {
  const href = props.session.latestHpActionPdfUrl;

  return (
    <Page title="Your HP Action packet is ready!" withHeading="big" className="content">
      <p>Here is all of your HP Action paperwork, including instructions for how to navigate the process:</p>
      {href && <PdfLink href={href} label="Download HP Action packet" />}
      <h2>What happens next?</h2>
      <BigList>
        <li><strong>Print out this packet and bring it to Housing Court.</strong> Do not sign any of the documents until you bring them to court.</li>
        <li>Once you arrive at court, <strong>go to the clerk’s office to file these papers</strong>. They will assign you an Index Number and various dates.</li>
        <li>After you file your papers, you will need to <strong>serve your landlord and/or management company</strong>. You must use USPS Certified Mail Return Receipt to serve the paperwork.</li>
      </BigList>
      <h2>Email a copy of your HP Action packet to yourself or someone you trust</h2>
      <EmailAttachmentForm mutation={EmailHpActionPdfMutation} noun="HP Action packet" />
      <h2>Want to read more about your rights?</h2>
      <ul>
        <li><OutboundLink href="https://www.metcouncilonhousing.org/help-answers/getting-repairs/" target="_blank">Met Council on Housing</OutboundLink>
          {' '}(<OutboundLink href="https://www.metcouncilonhousing.org/help-answers/how-to-get-repairs-spanish/" target="_blank">en español</OutboundLink>)</li>
        <li><OutboundLink href="http://housingcourtanswers.org/answers/for-tenants/hp-actions-tenants/" target="_blank">Housing Court Answers</OutboundLink></li>
        <li><OutboundLink href="https://www.lawhelpny.org/nyc-housing-repairs" target="_blank">LawHelpNY</OutboundLink></li>
        <li><OutboundLink href="https://www.justfix.nyc/learn?utm_source=tenantplatform&utm_medium=hp" target="_blank">JustFix.nyc's Learning Center</OutboundLink></li>
      </ul>
    </Page>
  );
});

const hpActionDetailsStepBuilder = new SessionStepBuilder(sess => sess.hpActionDetails);

const UrgentAndDangerous = hpActionDetailsStepBuilder.createStep({
  title: "Urgency of issues",
  mutation: HpActionUrgentAndDangerousMutation,
  toFormInput: hp => hp.yesNoRadios('urgentAndDangerous').finish(),
  renderIntro: () => (
    <p>We strongly suggest completing a city inspection because inspection reports are valuable evidence when it comes to building your case. However, if the issues in your apartment are urgent and immediately dangerous, you can ask the court to go forward without inspection.</p>
  ),
  renderForm: (ctx) => <>
    <YesNoRadiosFormField
      {...ctx.fieldPropsFor('urgentAndDangerous')}
      label="Do you want to skip the inspection?"
      noLabel="No, I do not want to skip the inspection"
    />
  </>
});

const Sue = hpActionDetailsStepBuilder.createStep({
  title: "What would you like to do? (Select all that apply)",
  mutation: HpActionSueMutation,
  toFormInput: hp => hp.nullsToBools(false, 'sueForRepairs', 'sueForHarassment').finish(),
  renderForm: (ctx) => <>
    <CheckboxFormField {...ctx.fieldPropsFor('sueForRepairs')}>
      Sue my landlord for repairs
    </CheckboxFormField>
    <CheckboxFormField {...ctx.fieldPropsFor('sueForHarassment')}>
      Sue my landlord for harassment
    </CheckboxFormField>
  </>
});

const PreviousAttempts = createHPActionPreviousAttempts(() => Routes.locale.hp);

export const getHPActionProgressRoutesProps = (): ProgressRoutesProps => ({
  toLatestStep: Routes.locale.hp.latestStep,
  label: "HP Action",
  welcomeSteps: [{
    path: Routes.locale.hp.splash, exact: true, component: HPActionSplash,
    isComplete: (s) => !!s.phoneNumber
  }, {
    path: Routes.locale.hp.welcome, exact: true, component: HPActionWelcome
  }],
  stepsToFillOut: [
    { path: Routes.locale.hp.sue, component: Sue },
    { path: Routes.locale.hp.issues.prefix, component: HPActionIssuesRoutes,
      shouldBeSkipped: isNotSuingForRepairs },
    { path: Routes.locale.hp.tenantChildren, component: TenantChildren,
      shouldBeSkipped: isNotSuingForRepairs },
    { path: Routes.locale.hp.accessForInspection, component: AccessForInspection,
      shouldBeSkipped: isNotSuingForRepairs },
    { path: Routes.locale.hp.prevAttempts, component: PreviousAttempts,
      shouldBeSkipped: isNotSuingForRepairs },
    { path: Routes.locale.hp.urgentAndDangerous, component: UrgentAndDangerous,
      shouldBeSkipped: isNotSuingForRepairs },
    { path: Routes.locale.hp.harassmentApartment, component: HarassmentApartment,
      shouldBeSkipped: isNotSuingForHarassment },
    { path: Routes.locale.hp.harassmentAllegations1, component: HarassmentAllegations1,
      shouldBeSkipped: isNotSuingForHarassment },
    { path: Routes.locale.hp.harassmentAllegations2, component: HarassmentAllegations2,
      shouldBeSkipped: isNotSuingForHarassment },
    { path: Routes.locale.hp.harassmentExplain, component: HarassmentExplain,
      shouldBeSkipped: isNotSuingForHarassment },
    { path: Routes.locale.hp.harassmentCaseHistory, component: HarassmentCaseHistory,
      shouldBeSkipped: isNotSuingForHarassment },
    { path: Routes.locale.hp.feeWaiverStart, exact: true, component: FeeWaiverStart },
    { path: Routes.locale.hp.feeWaiverMisc, component: FeeWaiverMisc,
      isComplete: hasFeeWaiverAnd(fw => fw.askedBefore !== null) },
    { path: Routes.locale.hp.feeWaiverIncome, component: FeeWaiverIncome,
      isComplete: hasFeeWaiverAnd(fw => fw.incomeAmountMonthly !== null) },
    { path: Routes.locale.hp.feeWaiverPublicAssistance, component: FeeWaiverPublicAssistance,
      isComplete: hasFeeWaiverAnd(fw => fw.receivesPublicAssistance !== null) },
    { path: Routes.locale.hp.feeWaiverExpenses, component: FeeWaiverExpenses,
      isComplete: hasFeeWaiverAnd(fw => fw.rentAmount !== null) },
    { path: Routes.locale.hp.yourLandlord, exact: true, component: YourLandlord,
      isComplete: (s) => s.hpActionUploadStatus !== HPUploadStatus.NOT_STARTED },
  ],
  confirmationSteps: [
    { path: Routes.locale.hp.waitForUpload, exact: true, component: UploadStatus,
      isComplete: (s) => s.hpActionUploadStatus === HPUploadStatus.SUCCEEDED },
    { path: Routes.locale.hp.confirmation, exact: true, component: HPActionConfirmation}
  ]
});

const HPActionRoutes = buildProgressRoutesComponent(getHPActionProgressRoutesProps);

export default HPActionRoutes;
