import React from "react";

import Routes, { getSignupIntentOnboardingInfo } from "../routes";
import Page from "../ui/page";
import { ProgressButtons } from "../ui/buttons";
import { IssuesRoutes } from "../issues/issue-pages";
import { withAppContext, AppContextType } from "../app-context";
import { PdfLink } from "../ui/pdf-link";
import {
  ProgressRoutesProps,
  buildProgressRoutesComponent,
} from "../progress/progress-routes";
import { OutboundLink } from "../analytics/google-analytics";
import {
  HPUploadStatus,
  OnboardingInfoSignupIntent,
} from "../queries/globalTypes";
import {
  FeeWaiverMisc,
  FeeWaiverIncome,
  FeeWaiverExpenses,
  FeeWaiverPublicAssistance,
  FeeWaiverStart,
} from "./fee-waiver";
import { MiddleProgressStep } from "../progress/progress-step-route";
import { TenantChildren } from "./hp-action-tenant-children";
import { createHPActionPreviousAttempts } from "./hp-action-previous-attempts";
import { CheckboxFormField } from "../forms/form-fields";
import { HpActionUrgentAndDangerousMutation } from "../queries/HpActionUrgentAndDangerousMutation";
import { YesNoRadiosFormField } from "../forms/yes-no-radios-form-field";
import { SessionStepBuilder } from "../progress/session-step-builder";
import {
  HarassmentApartment,
  HarassmentExplain,
  HarassmentAllegations1,
  HarassmentAllegations2,
} from "./hp-action-harassment";
import { HpActionSueMutation } from "../queries/HpActionSueMutation";
import { HarassmentCaseHistory } from "./hp-action-case-history";
import { BigList } from "../ui/big-list";
import { EmailAttachmentForm } from "../forms/email-attachment";
import { EmailHpActionPdfMutation } from "../queries/EmailHpActionPdfMutation";
import { GetStartedButton } from "../ui/get-started-button";
import { AccessForInspection } from "./hp-action-access-for-inspection";
import { HPActionYourLandlord } from "./hp-action-your-landlord";
import { GeneratePDFForm, ShowHPUploadStatus } from "./hp-action-generate-pdf";
import {
  isNotSuingForRepairs,
  isNotSuingForHarassment,
  hasFeeWaiverAnd,
} from "./hp-action-util";
import { CustomerSupportLink } from "../ui/customer-support-link";
import { isUserNycha } from "../util/nycha";
import { HpActionSue } from "./sue";

const onboardingForHPActionRoute = () =>
  getSignupIntentOnboardingInfo(OnboardingInfoSignupIntent.HP).onboarding
    .latestStep;

function Disclaimer(): JSX.Element {
  return (
    <div className="notification is-warning">
      <p>
        Please note that this is a new service. It is still{" "}
        <strong>undergoing final testing</strong> before its official release.
      </p>
      <p>
        Should you encounter any bugs, glitches, lack of functionality or other
        problems, please let us know at <CustomerSupportLink /> so we can fix
        them.
      </p>
    </div>
  );
}

function HPActionSplash(): JSX.Element {
  return (
    <Page
      title="Sue your landlord for Repairs and/or Harassment through an HP Action proceeding"
      withHeading="big"
      className="content"
    >
      <Disclaimer />
      <p>
        Welcome to JustFix.nyc! This website will guide you through the process
        of starting an <strong>HP Action</strong> proceeding.
      </p>
      <p>
        An <strong>HP Action</strong> is a legal case you can bring against your
        landlord for failing to make repairs, not providing essential services,
        or harassing you.
      </p>
      <p>
        <em>This service is free and secure.</em>
      </p>
      <GetStartedButton
        to={onboardingForHPActionRoute()}
        intent={OnboardingInfoSignupIntent.HP}
        pageType="splash"
      >
        Start my case
      </GetStartedButton>
    </Page>
  );
}

const HPActionWelcome = withAppContext((props: AppContextType) => {
  const title = `Welcome, ${props.session.firstName}! Let's start your HP Action paperwork.`;

  return (
    <Page title={title} withHeading="big" className="content">
      <Disclaimer />
      <p>
        An <strong>HP (Housing Part) Action</strong> is a legal case you can
        bring against your landlord for failing to make repairs, not providing
        essential services, or harassing you. Here is how it works:
      </p>
      <ol className="has-text-left">
        <li>You answer a few questions here about your housing situation.</li>
        <li>
          We provide you with a pre-filled packet of all the paperwork you’ll
          need.
        </li>
        <li>
          <strong>
            You print out this packet and bring it to Housing Court.
          </strong>{" "}
          It will include instructions for <strong>filing in court</strong>.
        </li>
      </ol>
      <GetStartedButton
        to={Routes.locale.hp.sue}
        intent={OnboardingInfoSignupIntent.HP}
        pageType="welcome"
      >
        Get started
      </GetStartedButton>
      <br />
      <p>
        <strong>
          You do not need a lawyer to be successful in an HP Action.
        </strong>{" "}
        You must be able to show the court that repairs are needed, what those
        repairs are, and, if you are suing for harassment, you must provide
        proof of the harassing behavior. This includes photo evidence of the
        issues, HPD inspection reports, and communication with your landlord.
      </p>
    </Page>
  );
});

const HPActionIssuesRoutes = MiddleProgressStep((props) => (
  <IssuesRoutes
    routes={Routes.locale.hp.issues}
    introContent={
      <>
        This <strong>issue checklist</strong> will be the basis for your case.
      </>
    }
    toBack={props.prevStep}
    toNext={props.nextStep}
  />
));

const PrepareToGeneratePDF = MiddleProgressStep((props) => (
  <Page title="Almost done!" withHeading className="content">
    <p>
      Now for the final step: we're going to prepare your Emergency HP Action
      paperwork for you to review.
    </p>
    <p>This will take a little while, so sit tight.</p>
    <GeneratePDFForm
      toWaitForUpload={Routes.locale.hp.waitForUpload}
      kind="NORMAL"
    >
      {(ctx) => (
        <ProgressButtons
          back={props.prevStep}
          isLoading={ctx.isLoading}
          nextLabel="Prepare forms"
        />
      )}
    </GeneratePDFForm>
  </Page>
));

const UploadStatus = () => (
  <ShowHPUploadStatus
    kind="NORMAL"
    toWaitForUpload={Routes.locale.hp.waitForUpload}
    toSuccess={Routes.locale.hp.confirmation}
    toNotStarted={Routes.locale.hp.latestStep}
  />
);

const HPActionConfirmation = withAppContext((props: AppContextType) => {
  const href = props.session.latestHpActionPdfUrl;

  return (
    <Page
      title="Your HP Action packet is ready!"
      withHeading="big"
      className="content"
    >
      <p>
        Here is all of your HP Action paperwork, including instructions for how
        to navigate the process:
      </p>
      {href && <PdfLink href={href} label="Download HP Action packet" />}
      <h2>What happens next?</h2>
      <BigList>
        <li>
          <strong>Print out this packet and bring it to Housing Court.</strong>{" "}
          Do not sign any of the documents until you bring them to court.
        </li>
        <li>
          Once you arrive at court,{" "}
          <strong>go to the clerk’s office to file these papers</strong>. They
          will assign you an Index Number and various dates.
        </li>
        <li>
          After you file your papers, you will need to{" "}
          <strong>serve your landlord and/or management company</strong>. You
          must use USPS Certified Mail Return Receipt to serve the paperwork.
        </li>
      </BigList>
      <h2>
        Email a copy of your HP Action packet to yourself or someone you trust
      </h2>
      <EmailAttachmentForm
        mutation={EmailHpActionPdfMutation}
        noun="HP Action packet"
      />
      <h2>Want to read more about your rights?</h2>
      <ul>
        <li>
          <OutboundLink
            href="https://www.metcouncilonhousing.org/help-answers/getting-repairs/"
            target="_blank"
          >
            Met Council on Housing
          </OutboundLink>{" "}
          (
          <OutboundLink
            href="https://www.metcouncilonhousing.org/help-answers/how-to-get-repairs-spanish/"
            target="_blank"
          >
            en español
          </OutboundLink>
          )
        </li>
        <li>
          <OutboundLink
            href="http://housingcourtanswers.org/answers/for-tenants/hp-actions-tenants/"
            target="_blank"
          >
            Housing Court Answers
          </OutboundLink>
        </li>
        <li>
          <OutboundLink
            href="https://www.lawhelpny.org/nyc-housing-repairs"
            target="_blank"
          >
            LawHelpNY
          </OutboundLink>
        </li>
        <li>
          <OutboundLink
            href="https://www.justfix.nyc/learn?utm_source=tenantplatform&utm_medium=hp"
            target="_blank"
          >
            JustFix.nyc's Learning Center
          </OutboundLink>
        </li>
      </ul>
    </Page>
  );
});

const hpActionDetailsStepBuilder = new SessionStepBuilder(
  (sess) => sess.hpActionDetails
);

const UrgentAndDangerous = hpActionDetailsStepBuilder.createStep({
  title: "Urgency of issues",
  mutation: HpActionUrgentAndDangerousMutation,
  toFormInput: (hp) => hp.yesNoRadios("urgentAndDangerous").finish(),
  renderIntro: () => (
    <p>
      We strongly suggest completing a city inspection because inspection
      reports are valuable evidence when it comes to building your case.
      However, if the issues in your apartment are urgent and immediately
      dangerous, you can ask the court to go forward without inspection.
    </p>
  ),
  renderForm: (ctx) => (
    <>
      <YesNoRadiosFormField
        {...ctx.fieldPropsFor("urgentAndDangerous")}
        label="Do you want to skip the inspection?"
        noLabel="No, I do not want to skip the inspection"
      />
    </>
  ),
});

const PreviousAttempts = createHPActionPreviousAttempts(() => Routes.locale.hp);

export const getHPActionProgressRoutesProps = (): ProgressRoutesProps => ({
  toLatestStep: Routes.locale.hp.latestStep,
  label: "HP Action",
  welcomeSteps: [
    {
      path: Routes.locale.hp.splash,
      exact: true,
      component: HPActionSplash,
      isComplete: (s) => !!s.phoneNumber,
    },
    {
      path: Routes.locale.hp.welcome,
      exact: true,
      component: HPActionWelcome,
    },
  ],
  stepsToFillOut: [
    { path: Routes.locale.hp.sue, component: HpActionSue },
    {
      path: Routes.locale.hp.issues.prefix,
      component: HPActionIssuesRoutes,
      shouldBeSkipped: isNotSuingForRepairs,
    },
    {
      path: Routes.locale.hp.tenantChildren,
      component: TenantChildren,
      shouldBeSkipped: isNotSuingForRepairs,
    },
    {
      path: Routes.locale.hp.accessForInspection,
      component: AccessForInspection,
      shouldBeSkipped: isNotSuingForRepairs,
    },
    {
      path: Routes.locale.hp.prevAttempts,
      component: PreviousAttempts,
      shouldBeSkipped: (s) => isNotSuingForRepairs(s) || isUserNycha(s),
    },
    {
      path: Routes.locale.hp.urgentAndDangerous,
      component: UrgentAndDangerous,
      shouldBeSkipped: isNotSuingForRepairs,
    },
    {
      path: Routes.locale.hp.harassmentApartment,
      component: HarassmentApartment,
      shouldBeSkipped: isNotSuingForHarassment,
    },
    {
      path: Routes.locale.hp.harassmentAllegations1,
      component: HarassmentAllegations1,
      shouldBeSkipped: isNotSuingForHarassment,
    },
    {
      path: Routes.locale.hp.harassmentAllegations2,
      component: HarassmentAllegations2,
      shouldBeSkipped: isNotSuingForHarassment,
    },
    {
      path: Routes.locale.hp.harassmentExplain,
      component: HarassmentExplain,
      shouldBeSkipped: isNotSuingForHarassment,
    },
    {
      path: Routes.locale.hp.harassmentCaseHistory,
      component: HarassmentCaseHistory,
      shouldBeSkipped: isNotSuingForHarassment,
    },
    {
      path: Routes.locale.hp.feeWaiverStart,
      exact: true,
      component: FeeWaiverStart,
    },
    {
      path: Routes.locale.hp.feeWaiverMisc,
      component: FeeWaiverMisc,
      isComplete: hasFeeWaiverAnd((fw) => fw.askedBefore !== null),
    },
    {
      path: Routes.locale.hp.feeWaiverIncome,
      component: FeeWaiverIncome,
      isComplete: hasFeeWaiverAnd((fw) => fw.incomeAmountMonthly !== null),
    },
    {
      path: Routes.locale.hp.feeWaiverPublicAssistance,
      component: FeeWaiverPublicAssistance,
      isComplete: hasFeeWaiverAnd((fw) => fw.receivesPublicAssistance !== null),
    },
    {
      path: Routes.locale.hp.feeWaiverExpenses,
      component: FeeWaiverExpenses,
      isComplete: hasFeeWaiverAnd((fw) => fw.rentAmount !== null),
    },
    {
      path: Routes.locale.hp.yourLandlord,
      exact: true,
      component: HPActionYourLandlord,
    },
    {
      path: Routes.locale.hp.ready,
      exact: true,
      component: PrepareToGeneratePDF,
      isComplete: (s) => s.hpActionUploadStatus !== HPUploadStatus.NOT_STARTED,
    },
  ],
  confirmationSteps: [
    {
      path: Routes.locale.hp.waitForUpload,
      exact: true,
      component: UploadStatus,
      isComplete: (s) => s.hpActionUploadStatus === HPUploadStatus.SUCCEEDED,
    },
    {
      path: Routes.locale.hp.confirmation,
      exact: true,
      component: HPActionConfirmation,
    },
  ],
});

const HPActionRoutes = buildProgressRoutesComponent(
  getHPActionProgressRoutesProps
);

export default HPActionRoutes;
