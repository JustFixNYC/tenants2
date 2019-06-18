import React from 'react';

import Routes from "./routes";
import Page from "./page";
import { CenteredPrimaryButtonLink, BackButton, NextButton } from './buttons';
import { IssuesRoutes } from './pages/issue-pages';
import { withAppContext, AppContextType } from './app-context';
import { AllSessionInfo_landlordDetails, AllSessionInfo, AllSessionInfo_feeWaiver } from './queries/AllSessionInfo';
import { SessionUpdatingFormSubmitter, FormContextRenderer } from './forms';
import { GenerateHPActionPDFMutation } from './queries/GenerateHPActionPDFMutation';
import { PdfLink } from './pdf-link';
import { ProgressRoutesProps, buildProgressRoutesComponent } from './progress-routes';
import { OutboundLink } from './google-analytics';
import { HPUploadStatus } from './queries/globalTypes';
import { GetHPActionUploadStatus } from './queries/GetHPActionUploadStatus';
import { Redirect } from 'react-router';
import { SessionPoller } from './session-poller';
import { FeeWaiverMisc, FeeWaiverIncome, FeeWaiverExpenses, FeeWaiverPublicAssistance, FeeWaiverStart } from './pages/fee-waiver';
import { ProgressStepProps } from './progress-step-route';
import { assertNotNull } from './util';
import { TenantChildren } from './pages/hp-action-tenant-children';
import { HPActionPreviousAttempts } from './pages/hp-action-previous-attempts';
import { BlankAccessForInspectionInput, AccessForInspectionMutation } from './queries/AccessForInspectionMutation';
import { TextualFormField } from './form-fields';
import { getInitialFormInput } from './form-input-converter';

const onboardingForHPActionRoute = () => Routes.locale.hp.onboarding.latestStep;

function HPActionSplash(): JSX.Element {
  return (
    <Page title="Sue your landlord for repairs through an HP Action proceeding" withHeading="big" className="content">
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
        <li>Answer a few questions about your housing situation.</li>
        <li>We provide you with a pre-filled packet of all the paperwork you’ll need.</li>
        <li><strong>Print out this packet and bring it to Housing Court.</strong> It will include instructions for <strong>filing in court</strong> and <strong>serving your landlord</strong>.
</li>
      </ol>
      <CenteredPrimaryButtonLink to={Routes.locale.hp.issues.home}>
        Select repair issues
      </CenteredPrimaryButtonLink>
      <br/>
      <p>
        <strong>You do not need a lawyer to be successful in an HP Action.</strong> You must be able to show the court that repairs are needed and what those repairs are. This includes photo evidence of the issues, HPD inspection reports, and communication with your landlord.
      </p>
    </Page>
  );
});

const HPActionIssuesRoutes = (props: ProgressStepProps) => (
  <IssuesRoutes
    routes={Routes.locale.hp.issues}
    introContent={<>This <strong>issue checklist</strong> will be the basis for your case.</>}
    toBack={assertNotNull(props.prevStep)}
    toNext={assertNotNull(props.nextStep)}
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
          <div className="buttons jf-two-buttons">
            <BackButton to={assertNotNull(props.prevStep)} />
            <NextButton isLoading={ctx.isLoading} label="Generate forms"/>
          </div>
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
    <Page title="Your HP Action packet has been created!" withHeading className="content">
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

const AccessForInspection = (props: ProgressStepProps) => (
  <Page title="Access for Your HPD Inspection" withHeading>
    <div className="content">
      <p>On the day of your HPD Inspection, the Inspector will need access to your apartment during a window of time that you will choose with the HP Clerk when you submit your paperwork in Court.</p>
    </div>
    <SessionUpdatingFormSubmitter
      mutation={AccessForInspectionMutation}
      onSuccessRedirect={assertNotNull(props.nextStep)}
      initialState={({ onboardingInfo }) => getInitialFormInput(
        onboardingInfo,
        BlankAccessForInspectionInput,
        o => o.finish()
      )}
    >
      {(ctx) => <>
        <TextualFormField {...ctx.fieldPropsFor('floorNumber')} type="number" min="0" label="What floor do you live on?" />
        <div className="buttons jf-two-buttons">
          <BackButton to={assertNotNull(props.prevStep)} />
          <NextButton isLoading={ctx.isLoading} />
        </div>
      </>}
    </SessionUpdatingFormSubmitter>
  </Page>
);

const hasFeeWaiverAnd = (condition: (fw: AllSessionInfo_feeWaiver) => boolean) => (session: AllSessionInfo) => (
  session.feeWaiver ? condition(session.feeWaiver) : false
);

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
    { path: Routes.locale.hp.issues.prefix, component: HPActionIssuesRoutes },
    { path: Routes.locale.hp.tenantChildren, component: TenantChildren },
    { path: Routes.locale.hp.accessForInspection, component: AccessForInspection },
    { path: Routes.locale.hp.prevAttempts, component: HPActionPreviousAttempts },
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
