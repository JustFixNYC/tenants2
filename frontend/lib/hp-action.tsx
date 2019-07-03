import React from 'react';

import Routes from "./routes";
import Page from "./page";
import { CenteredPrimaryButtonLink, NextButton, ProgressButtons } from './buttons';
import { IssuesRoutes } from './pages/issue-pages';
import { withAppContext, AppContextType } from './app-context';
import { AllSessionInfo_landlordDetails, AllSessionInfo, AllSessionInfo_feeWaiver } from './queries/AllSessionInfo';
import { SessionUpdatingFormSubmitter } from './session-updating-form-submitter';
import { GenerateHPActionPDFMutation } from './queries/GenerateHPActionPDFMutation';
import { PdfLink } from './pdf-link';
import { ProgressRoutesProps, buildProgressRoutesComponent } from './progress-routes';
import { OutboundLink } from './google-analytics';
import { HPUploadStatus } from './queries/globalTypes';
import { GetHPActionUploadStatus } from './queries/GetHPActionUploadStatus';
import { Redirect } from 'react-router';
import { SessionPoller } from './session-poller';
import { FeeWaiverMisc, FeeWaiverIncome, FeeWaiverExpenses, FeeWaiverPublicAssistance, FeeWaiverStart } from './pages/fee-waiver';
import { ProgressStepProps, MiddleProgressStep } from './progress-step-route';
import { assertNotNull } from './util';
import { TenantChildren } from './pages/hp-action-tenant-children';
import { HPActionPreviousAttempts } from './pages/hp-action-previous-attempts';
import { AccessForInspectionMutation } from './queries/AccessForInspectionMutation';
import { TextualFormField, CheckboxFormField } from './form-fields';
import { HpActionUrgentAndDangerousMutation } from './queries/HpActionUrgentAndDangerousMutation';
import { YesNoRadiosFormField } from './yes-no-radios-form-field';
import { SessionStepBuilder } from './session-step-builder';
import { HarassmentApartment, HarassmentExplain, HarassmentAllegations1, HarassmentAllegations2 } from './pages/hp-action-harassment';
import { FormContextRenderer } from './form';
import { HpActionSueMutation } from './queries/HpActionSueMutation';
import { HarassmentCaseHistory } from './pages/hp-action-case-history';

const onboardingForHPActionRoute = () => Routes.locale.hp.onboarding.latestStep;

function HPActionSplash(): JSX.Element {
  return (
    <Page title="Sue your landlord for Repairs and/or Harassment through an HP Action proceeding" withHeading="big" className="content">
      <p>Welcome to JustFix.nyc! This website will guide you through the process of starting an <strong>HP Action</strong> proceeding.</p>
      <p>An <strong>HP Action</strong> is a legal case you can bring against your landlord for failing to make repairs, not providing essential services, or harassing you.</p>
      <p><em>This service is free, secure, and confidential.</em></p>
      <CenteredPrimaryButtonLink className="is-large" to={onboardingForHPActionRoute()}>
        Start my case
      </CenteredPrimaryButtonLink>
    </Page>
  );
}

const HPActionWelcome = withAppContext((props: AppContextType) => {
  const title = `Welcome, ${props.session.firstName}! Let's start your HP Action paperwork.`;

  return (
    <Page title={title} withHeading="big" className="content">
      <p>
        An <strong>HP (Housing Part) Action</strong> is a legal case you can bring against your landlord for failing to make repairs, not providing essential services, or harassing you. Here is how it works:
      </p>
      <ol className="has-text-left">
        <li>You answer a few questions here about your housing situation.</li>
        <li>We provide you with a pre-filled packet of all the paperwork you’ll need.</li>
        <li><strong>You print out this packet and bring it to Housing Court.</strong> It will include instructions for <strong>filing in court</strong> and <strong>serving your landlord</strong>.
</li>
      </ol>
      <CenteredPrimaryButtonLink to={Routes.locale.hp.sue}>
        Get started
      </CenteredPrimaryButtonLink>
      <br/>
      <p>
        <strong>You do not need a lawyer to be successful in an HP Action.</strong> You must be able to show the court that repairs are needed, what those repairs are, and, if you are suing for harassment, you must provide proof of the harassing behavior. This includes photo evidence of the issues, HPD inspection reports, and communication with your landlord.
      </p>
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

const GeneratePDFForm = (props: { children: FormContextRenderer<{}> }) => (
  <SessionUpdatingFormSubmitter mutation={GenerateHPActionPDFMutation} initialState={{}}
   onSuccessRedirect={Routes.locale.hp.waitForUpload} {...props} />
);

const HPActionYourLandlord = withAppContext((props: AppContextType & ProgressStepProps) => {
  const details = props.session.landlordDetails;

  return (
    <Page title="Your landlord" withHeading className="content">
      {details && details.isLookedUp && details.name && details.address
        ? <LandlordDetails details={details} />
        : <p>We were unable to retrieve information from the <b>NYC Department of Housing and Preservation (HPD)</b> about your landlord, so you will need to fill out the information yourself once we give you the forms.</p>}
      <GeneratePDFForm>
        {(ctx) =>
          <ProgressButtons back={assertNotNull(props.prevStep)} isLoading={ctx.isLoading}
            nextLabel="Generate forms" />
        }
      </GeneratePDFForm>
    </Page>
  );
});

const HPActionUploadError = () => (
  <Page title="Alas." withHeading className="content">
    <p>Unfortunately, an error occurred when generating your HP Action packet.</p>
    <GeneratePDFForm>
      {(ctx) => <NextButton isLoading={ctx.isLoading} label="Try again"/>}
    </GeneratePDFForm>
  </Page>
);

const HPActionWaitForUpload = () => (
  <Page title="Please wait">
    <p className="has-text-centered">
      Please wait while your HP action documents are generated&hellip;
    </p>
    <SessionPoller query={GetHPActionUploadStatus} />
    <section className="section" aria-hidden="true">
      <div className="jf-loading-overlay">
        <div className="jf-loader"/>
      </div>
    </section>
  </Page>
);

const ShowHPUploadStatus = withAppContext((props: AppContextType) => {
  let status = props.session.hpActionUploadStatus;

  switch (status) {
    case HPUploadStatus.STARTED:
    return <HPActionWaitForUpload />;

    case HPUploadStatus.SUCCEEDED:
    return <Redirect to={Routes.locale.hp.confirmation} />;

    case HPUploadStatus.ERRORED:
    return <HPActionUploadError />;

    case HPUploadStatus.NOT_STARTED:
    return <Redirect to={Routes.locale.hp.latestStep} />;
  }
});

const HPActionConfirmation = withAppContext((props: AppContextType) => {
  const href = props.session.latestHpActionPdfUrl;

  return (
    <Page title="Your HP Action packet is ready!" withHeading className="content">
      <p>Here is all of your HP Action paperwork, including instructions for how to navigate the process:</p>
      {href && <PdfLink href={href} label="Download HP Action packet" />}
      <h2>What happens next?</h2>
      <ol className="jf-biglist">
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

const onboardingStepBuilder = new SessionStepBuilder(sess => sess.onboardingInfo);

const AccessForInspection = onboardingStepBuilder.createStep({
  title: "Access for Your HPD Inspection",
  mutation: AccessForInspectionMutation,
  toFormInput: onb => onb.finish(),
  renderIntro: () => <>
    <p>On the day of your HPD Inspection, the Inspector will need access to your apartment during a window of time that you will choose with the HP Clerk when you submit your paperwork in Court.</p>
  </>,
  renderForm: ctx => <>
    <TextualFormField {...ctx.fieldPropsFor('floorNumber')} type="number" min="0" label="What floor do you live on?" />
  </>,
});

const hpActionDetailsStepBuilder = new SessionStepBuilder(sess => sess.hpActionDetails);

const UrgentAndDangerous = hpActionDetailsStepBuilder.createStep({
  title: "Urgency of issues",
  mutation: HpActionUrgentAndDangerousMutation,
  toFormInput: hp => hp.yesNoRadios('urgentAndDangerous').finish(),
  renderIntro: () => (
    <p>If the problems in your apartment are urgent and immediately dangerous to you or your family’s health and safety, you can ask the court to go forward without doing a city inspection first. This means that the city will <strong>not</strong> send someone to inspect the apartment and that you will not get an inspection report. You should know that an inspection report is useful evidence in your case, though.</p>
  ),
  renderForm: (ctx) => <>
    <YesNoRadiosFormField
      {...ctx.fieldPropsFor('urgentAndDangerous')}
      label="Are the conditions urgent and dangerous, and do you want to skip the inspection?"
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

/**
 * Returns whether the given session fee waiver info exists, and, if so, whether
 * it satisfies the criteria encapsulated by the given predicate function.
 */
const hasFeeWaiverAnd = (condition: (fw: AllSessionInfo_feeWaiver) => boolean) => (session: AllSessionInfo) => (
  session.feeWaiver ? condition(session.feeWaiver) : false
);

export function isNotSuingForHarassment(session: AllSessionInfo): boolean {
  if (!session.hpActionDetails) return true;
  return session.hpActionDetails.sueForHarassment !== true;
}

export function isNotSuingForRepairs(session: AllSessionInfo): boolean {
  if (!session.hpActionDetails) return true;
  return session.hpActionDetails.sueForRepairs !== true;
}

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
    { path: Routes.locale.hp.harassmentCaseHistory, component: HarassmentCaseHistory,
      shouldBeSkipped: isNotSuingForHarassment },
    { path: Routes.locale.hp.issues.prefix, component: HPActionIssuesRoutes,
      shouldBeSkipped: isNotSuingForRepairs },
    { path: Routes.locale.hp.tenantChildren, component: TenantChildren,
      shouldBeSkipped: isNotSuingForRepairs },
    { path: Routes.locale.hp.accessForInspection, component: AccessForInspection,
      shouldBeSkipped: isNotSuingForRepairs },
    { path: Routes.locale.hp.prevAttempts, component: HPActionPreviousAttempts,
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
    { path: Routes.locale.hp.feeWaiverStart, exact: true, component: FeeWaiverStart },
    { path: Routes.locale.hp.feeWaiverMisc, component: FeeWaiverMisc,
      isComplete: hasFeeWaiverAnd(fw => fw.askedBefore !== null) },
    { path: Routes.locale.hp.feeWaiverIncome, component: FeeWaiverIncome,
      isComplete: hasFeeWaiverAnd(fw => fw.incomeAmountMonthly !== null) },
    { path: Routes.locale.hp.feeWaiverPublicAssistance, component: FeeWaiverPublicAssistance,
      isComplete: hasFeeWaiverAnd(fw => fw.receivesPublicAssistance !== null) },
    { path: Routes.locale.hp.feeWaiverExpenses, component: FeeWaiverExpenses,
      isComplete: hasFeeWaiverAnd(fw => fw.rentAmount !== null) },
    { path: Routes.locale.hp.yourLandlord, exact: true, component: HPActionYourLandlord,
      isComplete: (s) => s.hpActionUploadStatus !== HPUploadStatus.NOT_STARTED },
  ],
  confirmationSteps: [
    { path: Routes.locale.hp.waitForUpload, exact: true, component: ShowHPUploadStatus,
      isComplete: (s) => s.hpActionUploadStatus === HPUploadStatus.SUCCEEDED },
    { path: Routes.locale.hp.confirmation, exact: true, component: HPActionConfirmation}
  ]
});

const HPActionRoutes = buildProgressRoutesComponent(getHPActionProgressRoutesProps);

export default HPActionRoutes;
