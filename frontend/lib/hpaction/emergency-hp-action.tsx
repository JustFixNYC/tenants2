import React, { useContext } from "react";
import JustfixRoutes, {
  getSignupIntentOnboardingInfo,
} from "../justfix-routes";
import {
  ProgressRoutesProps,
  buildProgressRoutesComponent,
} from "../progress/progress-routes";
import {
  HPUploadStatus,
  OnboardingInfoSignupIntent,
  HPDocusignStatus,
} from "../queries/globalTypes";
import Page from "../ui/page";
import { GetStartedButton } from "../ui/get-started-button";
import { AppContext } from "../app-context";
import { TenantChildren } from "./hp-action-tenant-children";
import {
  isNotSuingForRepairs,
  isNotSuingForHarassment,
} from "./hp-action-util";
import {
  MiddleProgressStep,
  ProgressStepProps,
} from "../progress/progress-step-route";
import { ProgressButtons, BackButton, NextButton } from "../ui/buttons";
import { Link, Switch, Route } from "react-router-dom";
import { EhpAccessForInspection } from "./hp-action-access-for-inspection";
import { createHPActionPreviousAttempts } from "./hp-action-previous-attempts";
import { HPActionYourLandlord } from "./hp-action-your-landlord";
import { GeneratePDFForm, ShowHPUploadStatus } from "./hp-action-generate-pdf";
import { assertNotNull } from "../util/util";
import { PdfLink } from "../ui/pdf-link";
import { BigList } from "../ui/big-list";
import { OutboundLink } from "../analytics/google-analytics";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import {
  EmergencyHpaIssuesMutation,
  BlankCustomHomeIssuesCustomIssueFormFormSetInput,
} from "../queries/EmergencyHpaIssuesMutation";
import {
  HiddenFormField,
  MultiCheckboxFormField,
  TextualFormField,
} from "../forms/form-fields";
import { LegacyFormSubmitter } from "../forms/legacy-form-submitter";
import { BeginDocusignMutation } from "../queries/BeginDocusignMutation";
import { performHardOrSoftRedirect } from "../browser-redirect";
import { MoratoriumWarning, CovidEhpDisclaimer } from "../ui/covid-banners";
import { StaticImage } from "../ui/static-image";
import { VerifyEmailMiddleProgressStep } from "../pages/verify-email";
import { customIssuesForArea } from "../issues/issues";
import { Formset } from "../forms/formset";
import {
  CUSTOM_ISSUE_MAX_LENGTH,
  MAX_CUSTOM_ISSUES_PER_AREA,
} from "../../../common-data/issue-validation.json";
import { FormsetItem, formsetItemProps } from "../forms/formset-item";
import { TextualFieldWithCharsRemaining } from "../forms/chars-remaining";
import { SessionStepBuilder } from "../progress/session-step-builder";
import { OptionalLandlordDetailsMutation } from "../queries/OptionalLandlordDetailsMutation";
import { PhoneNumberFormField } from "../forms/phone-number-form-field";
import { isUserNycha } from "../util/nycha";
import { ModalLink, Modal, BackOrUpOneDirLevel } from "../ui/modal";
import { CenteredButtons } from "../ui/centered-buttons";
import {
  EMERGENCY_HPA_ISSUE_SET,
  getEmergencyHPAIssueChoices,
} from "./emergency-hp-action-issues";
import { HpActionSue } from "./sue";
import {
  HarassmentApartment,
  HarassmentAllegations1,
  HarassmentAllegations2,
  HarassmentExplain,
} from "./hp-action-harassment";
import { HarassmentCaseHistory } from "./hp-action-case-history";
import { DemoDeploymentNote } from "../ui/demo-deployment-note";
import { createJustfixCrossSiteVisitorSteps } from "../justfix-cross-site-visitor-steps";
import { renderSuccessHeading } from "../ui/success-heading";
import { createHtmlEmailStaticPageRoutes } from "../static-page/routes";
import {
  ExampleServiceInstructionsEmail,
  ServiceInstructionsEmail,
} from "./service-instructions-email";
import { NycUsersOnly } from "../pages/nyc-users-only";

const HP_ICON = "frontend/img/hp-action.svg";

const onboardingForHPActionRoute = () =>
  getSignupIntentOnboardingInfo(OnboardingInfoSignupIntent.EHP).onboarding
    .latestStep;

function EmergencyHPActionSplash(): JSX.Element {
  const title =
    "Sue your landlord for Repairs and/or Harassment through an Emergency HP Action proceeding";
  return (
    <Page title={title}>
      <section className="hero is-light">
        <div className="hero-body">
          <div className="content has-text-centered">
            <div className="is-inline-block jf-hp-icon">
              <StaticImage ratio="is-square" src={HP_ICON} alt="" />
            </div>
            <h1 className="title is-spaced">{title}</h1>
          </div>
          <div className="columns is-centered">
            <div className="column is-four-fifths">
              <div className="content">
                <p className="subtitle">
                  An Emergency HP Action is a legal case you can bring against
                  your landlord for failing to make repairs, not providing
                  essential services, and/or harassing you. This service is free
                  and secure.
                </p>
                <CovidEhpDisclaimer />
                <GetStartedButton
                  to={onboardingForHPActionRoute()}
                  intent={OnboardingInfoSignupIntent.EHP}
                  pageType="splash"
                >
                  Start my case
                </GetStartedButton>
                <div className="content has-text-centered">
                  <p className="jf-secondary-cta">
                    Would you prefer to have personal assistance to start your
                    case?
                    <br />
                    Call the Housing Court Answers hotline at{" "}
                    <a href="tel:1-212-962-4795">212-962-4795</a> Monday to
                    Friday, 9am to 5pm.
                  </p>
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

const EmergencyHPActionWelcome: React.FC<ProgressStepProps> = (props) => {
  const { session } = useContext(AppContext);
  const title = `Welcome, ${session.firstName}! Let's start your Emergency HP Action paperwork.`;

  return (
    <Page title={title} withHeading="big" className="content">
      <CovidEhpDisclaimer />
      <p>
        An <strong>Emergency HP (Housing Part) Action</strong> is a legal case
        you can bring against your landlord for failing to make repairs, not
        providing essential services, and/or harassing you. Here is how it
        works:
      </p>
      <BigList>
        <li>
          Answer a few questions here about your housing situation and we will
          email your answers to your Borough’s Housing Court Clerk. You will
          also be emailed a copy of the paperwork.
        </li>
        <li>
          The Clerk will present the paperwork to the Judge and the Judge will
          decide whether or not to approve your case.
        </li>
        <li>
          If your case is approved, the clerk will email you the signed copy of
          the paperwork by email as an attachment. If your case is rejected, the
          Clerk will email you to let you know.
        </li>
        <li>
          Once you get the signed paperwork you will need to inform your
          landlord and/or management company that you are suing them by
          “serving” the papers on them. This is called service and it must be
          done exactly as the Judge says on your paperwork. It might be by USPS
          mail, email, or in-person. We will give you detailed instructions on
          how to serve in a confirmation email once your filing is submitted.
        </li>
        <li>
          Your case might be considered an emergency. If so, the court will
          assign you a lawyer. If not, you will need to do the rest of the
          process on your own. This is called being “pro-se”. If you do not hear
          from a lawyer within 3 days, you should assume that you will need to
          be pro-se.
        </li>
        <li>
          If you are suing for Repairs, an inspector from Housing Preservation
          and Development (HPD) will come to your apartment to verify the
          issue(s) and make a report for the court.
        </li>
        <li>
          The court hearing will happen through a video call so that{" "}
          <strong>you do not have to go to the Courthouse in-person</strong>.
          Your lawyer will give you all of the details and will guide you every
          step of the way.
        </li>
      </BigList>
      <br />
      <GetStartedButton
        to={assertNotNull(props.nextStep)}
        intent={OnboardingInfoSignupIntent.EHP}
        pageType="welcome"
      >
        Get started
      </GetStartedButton>
      <MoratoriumWarning />
    </Page>
  );
};

const Issues = MiddleProgressStep((props) => (
  <Page
    title="What type of problems are you experiencing?"
    withHeading
    className="content"
  >
    <SessionUpdatingFormSubmitter
      mutation={EmergencyHpaIssuesMutation}
      initialState={(session) => ({
        issues: session.issues.filter((issue) =>
          EMERGENCY_HPA_ISSUE_SET.has(issue)
        ),
        customHomeIssues: customIssuesForArea(
          "HOME",
          session.customIssuesV2 || []
        ).map((ci) => ({
          description: ci.description,
          id: ci.id,
          DELETE: false,
        })),
      })}
      onSuccessRedirect={props.nextStep}
    >
      {(ctx) => (
        <>
          <MultiCheckboxFormField
            {...ctx.fieldPropsFor("issues")}
            choices={getEmergencyHPAIssueChoices()}
            label="Select all issues that apply to your housing situation"
          />
          <br />
          <p>
            Don't see your issues listed? You can add up to{" "}
            {MAX_CUSTOM_ISSUES_PER_AREA} additional emergency home issues below.
          </p>
          <br />
          <Formset
            {...ctx.formsetPropsFor("customHomeIssues")}
            maxNum={MAX_CUSTOM_ISSUES_PER_AREA}
            extra={MAX_CUSTOM_ISSUES_PER_AREA}
            emptyForm={BlankCustomHomeIssuesCustomIssueFormFormSetInput}
          >
            {(ciCtx, i) => (
              <FormsetItem {...formsetItemProps(ciCtx)}>
                <TextualFieldWithCharsRemaining
                  {...ciCtx.fieldPropsFor("description")}
                  maxLength={CUSTOM_ISSUE_MAX_LENGTH}
                  fieldProps={{
                    style: { maxWidth: `${CUSTOM_ISSUE_MAX_LENGTH}em` },
                  }}
                  label={`Custom home issue #${i + 1} (optional)`}
                />
              </FormsetItem>
            )}
          </Formset>
          <ProgressButtons back={props.prevStep} isLoading={ctx.isLoading} />
        </>
      )}
    </SessionUpdatingFormSubmitter>
  </Page>
));

const PrepareToGeneratePDF = MiddleProgressStep((props) => (
  <Page title="It's time to prepare your forms" withHeading className="content">
    <p>
      Next, we're going to prepare your Emergency HP Action paperwork for you to
      review.
    </p>
    <p>This could take a while, so sit tight.</p>
    <GeneratePDFForm
      toWaitForUpload={JustfixRoutes.locale.ehp.waitForUpload}
      kind="EMERGENCY"
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

const stepBuilder = new SessionStepBuilder((sess) => sess);

const YourLandlordOptionalDetails = stepBuilder.createStep(
  OptionalLandlordDetailsMutation,
  {
    title: "Optional landlord contact information",
    toFormInput: (sess) => ({
      email: sess.data.landlordDetails?.email || "",
      phoneNumber: sess.data.landlordDetails?.phoneNumber || "",
    }),
    renderIntro: () => (
      <>
        <p>
          Do you have your landlord's email or phone number? If so, please
          provide it below.
        </p>
        <p>
          Your lawyer will use this information to contact your landlord and
          move your case along faster.
        </p>
      </>
    ),
    renderForm: (ctx) => (
      <>
        <TextualFormField
          type="email"
          {...ctx.fieldPropsFor("email")}
          label="Landlord email (highly recommended)"
        />
        <PhoneNumberFormField
          {...ctx.fieldPropsFor("phoneNumber")}
          label="Landlord phone number (highly recommended)"
        />
      </>
    ),
  }
);

const UploadStatus = () => (
  <ShowHPUploadStatus
    kind="EMERGENCY"
    toWaitForUpload={JustfixRoutes.locale.ehp.waitForUpload}
    toSuccess={JustfixRoutes.locale.ehp.reviewForms}
    toNotStarted={JustfixRoutes.locale.ehp.latestStep}
  />
);

const SignModal: React.FC<{
  nextUrl: string;
}> = ({ nextUrl }) => {
  return (
    <Modal
      title="Sending you to DocuSign to sign your forms"
      withHeading
      onCloseGoTo={BackOrUpOneDirLevel}
      render={(modalCtx) => (
        <>
          <p>
            You're now going to be taken to the website DocuSign to sign your
            forms.
          </p>
          <p>
            This is the final step in the process of filing your HP Action
            paperwork.
          </p>
          <LegacyFormSubmitter
            mutation={BeginDocusignMutation}
            initialState={{ nextUrl }}
            onSuccessRedirect={(output, input) =>
              assertNotNull(output.redirectUrl)
            }
            performRedirect={performHardOrSoftRedirect}
          >
            {(ctx) => (
              <>
                <HiddenFormField {...ctx.fieldPropsFor("nextUrl")} />
                <CenteredButtons>
                  <NextButton
                    isLoading={ctx.isLoading}
                    buttonClass="is-success"
                    label="Sign my forms"
                  />
                  <Link
                    {...modalCtx.getLinkCloseProps()}
                    className="button is-text"
                  >
                    Go back
                  </Link>
                </CenteredButtons>
              </>
            )}
          </LegacyFormSubmitter>
        </>
      )}
    />
  );
};

const ReviewForms: React.FC<ProgressStepProps> = (props) => {
  const { session } = useContext(AppContext);
  const href =
    session.latestEmergencyHpActionPdfUrl &&
    `${session.latestEmergencyHpActionPdfUrl}`;
  const prevStep = assertNotNull(props.prevStep);
  const nextUrl = JustfixRoutes.locale.ehp.latestStep;

  return (
    <Page title="You're almost there!" withHeading="big" className="content">
      <p>
        Please review your Emergency HP Action forms to make sure everything is
        correct. If anything looks wrong, you can{" "}
        <Link to={prevStep}>go back</Link> and make changes now.
      </p>
      {href && <PdfLink href={href} label="Preview forms" />}
      <p>
        From here, you'll sign your forms electronically and we'll immediately
        send them to the courts for you.
      </p>
      <DemoDeploymentNote>
        <p>
          This demo site <strong>will not send</strong> real forms to any
          courts.
        </p>
      </DemoDeploymentNote>
      <div className="buttons jf-two-buttons jf-two-buttons--vertical">
        <BackButton to={prevStep} />
        <ModalLink
          to={JustfixRoutes.locale.ehp.reviewFormsSignModal}
          className="button is-primary is-medium"
          render={() => <SignModal nextUrl={nextUrl} />}
        >
          My forms look good to me!
        </ModalLink>
      </div>
    </Page>
  );
};

const Confirmation: React.FC<{}> = () => {
  return (
    <Page
      title="Your Emergency HP Action forms have been sent to the court!"
      className="content"
      withHeading={renderSuccessHeading}
    >
      <p>
        Your completed, signed Emergency HP Action forms have been emailed to
        you and your Borough's Housing Court.
      </p>
      <h2>What happens next?</h2>
      <BigList>
        <li>
          The Clerk will present the paperwork to the Judge and the Judge will
          decide whether or not to approve your case.
        </li>
        <li>
          If your case is approved, the clerk will email you the signed copy of
          the paperwork by email as an attachment. If your case is rejected, the
          Clerk will email you to let you know.
        </li>
        <li>
          Once you get the signed paperwork you will need to inform your
          landlord and/or management company that you are suing them by
          “serving” the papers on them. This is called service and it must be
          done exactly as the Judge says on your paperwork. It might be by USPS
          mail, email, or in-person. We will give you detailed instructions on
          how to serve in a confirmation email once your filing is submitted.
        </li>
        <li>
          Your case might be considered an emergency. If so, the court will
          assign you a lawyer. If not, you will need to do the rest of the
          process on your own. This is called being “pro-se”. If you do not hear
          from a lawyer within 3 days, you should assume that you will need to
          be pro-se.
        </li>
        <li>
          If you are suing for Repairs, an inspector from Housing Preservation
          and Development (HPD) will come to your apartment to verify the
          issue(s) and make a report for the court.
        </li>
        <li>
          The court hearing will happen through a video call so that{" "}
          <strong>you do not have to go to the Courthouse in-person</strong>.
          Your lawyer will give you all of the details and will guide you every
          step of the way.
        </li>
      </BigList>
      <h2>Do you need to re-file your case?</h2>
      <p>
        If you need to change something and re-file your case, you can always{" "}
        <Link to={JustfixRoutes.locale.ehp.sue}>start a new case</Link>.
      </p>
      <h2>Want to read more about your rights?</h2>
      <ul>
        {/* TODO: This is currently duplicated from the HP action flow, we might want to create a reusable component out of it. */}
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
            también en español
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
};

const PreviousAttempts = createHPActionPreviousAttempts(
  () => JustfixRoutes.locale.ehp
);

export const getEmergencyHPActionProgressRoutesProps = (): ProgressRoutesProps => ({
  toLatestStep: JustfixRoutes.locale.ehp.latestStep,
  label: "Emergency HP Action",
  defaultRequireLogin: true,
  defaultWrapContent: NycUsersOnly,
  welcomeSteps: [
    {
      path: JustfixRoutes.locale.ehp.splash,
      requireLogin: false,
      wrapContent: false,
      exact: true,
      component: EmergencyHPActionSplash,
      isComplete: (s) => !!s.phoneNumber,
    },
    {
      path: JustfixRoutes.locale.ehp.welcome,
      exact: true,
      component: EmergencyHPActionWelcome,
    },
  ],
  stepsToFillOut: [
    ...createJustfixCrossSiteVisitorSteps(JustfixRoutes.locale.ehp),
    { path: JustfixRoutes.locale.ehp.sue, component: HpActionSue },
    {
      path: JustfixRoutes.locale.ehp.issues,
      component: Issues,
      shouldBeSkipped: isNotSuingForRepairs,
    },
    {
      path: JustfixRoutes.locale.ehp.tenantChildren,
      component: TenantChildren,
      shouldBeSkipped: isNotSuingForRepairs,
    },
    {
      path: JustfixRoutes.locale.ehp.accessForInspection,
      component: EhpAccessForInspection,
      shouldBeSkipped: isNotSuingForRepairs,
    },
    {
      path: JustfixRoutes.locale.ehp.prevAttempts,
      component: PreviousAttempts,
      shouldBeSkipped: (s) => isNotSuingForRepairs(s) || isUserNycha(s),
    },
    {
      path: JustfixRoutes.locale.ehp.harassmentApartment,
      component: HarassmentApartment,
      shouldBeSkipped: isNotSuingForHarassment,
    },
    {
      path: JustfixRoutes.locale.ehp.harassmentAllegations1,
      component: HarassmentAllegations1,
      shouldBeSkipped: isNotSuingForHarassment,
    },
    {
      path: JustfixRoutes.locale.ehp.harassmentAllegations2,
      component: HarassmentAllegations2,
      shouldBeSkipped: isNotSuingForHarassment,
    },
    {
      path: JustfixRoutes.locale.ehp.harassmentExplain,
      component: HarassmentExplain,
      shouldBeSkipped: isNotSuingForHarassment,
    },
    {
      path: JustfixRoutes.locale.ehp.harassmentCaseHistory,
      component: HarassmentCaseHistory,
      shouldBeSkipped: isNotSuingForHarassment,
    },
    {
      path: JustfixRoutes.locale.ehp.yourLandlord,
      exact: true,
      component: HPActionYourLandlord,
    },
    {
      path: JustfixRoutes.locale.ehp.yourLandlordOptionalDetails,
      exact: true,
      component: YourLandlordOptionalDetails,
      shouldBeSkipped: isUserNycha,
    },
    {
      path: JustfixRoutes.locale.ehp.verifyEmail,
      exact: true,
      component: VerifyEmailMiddleProgressStep,
      shouldBeSkipped: (s) => !!s.isEmailVerified,
    },
    {
      path: JustfixRoutes.locale.ehp.prepare,
      exact: true,
      component: PrepareToGeneratePDF,
      neverGoBackTo: true,
      isComplete: (s) =>
        s.emergencyHpActionUploadStatus !== HPUploadStatus.NOT_STARTED,
    },
  ],
  confirmationSteps: [
    {
      path: JustfixRoutes.locale.ehp.waitForUpload,
      exact: true,
      component: UploadStatus,
      neverGoBackTo: true,
      isComplete: (s) =>
        s.emergencyHpActionUploadStatus === HPUploadStatus.SUCCEEDED,
    },
    {
      path: JustfixRoutes.locale.ehp.reviewForms,
      component: ReviewForms,
      isComplete: (s) =>
        s.emergencyHpActionSigningStatus === HPDocusignStatus.SIGNED,
    },
    {
      path: JustfixRoutes.locale.ehp.confirmation,
      exact: true,
      component: Confirmation,
    },
  ],
});

const EmergencyHPActionProgressRoutes = buildProgressRoutesComponent(
  getEmergencyHPActionProgressRoutesProps
);

const EmergencyHPActionRoutes: React.FC<{}> = () => (
  <Switch>
    {createHtmlEmailStaticPageRoutes(
      JustfixRoutes.locale.ehp.exampleServiceInstructionsEmail,
      ExampleServiceInstructionsEmail
    )}
    {createHtmlEmailStaticPageRoutes(
      JustfixRoutes.locale.ehp.serviceInstructionsEmail,
      ServiceInstructionsEmail
    )}
    <Route component={EmergencyHPActionProgressRoutes} />
  </Switch>
);

export default EmergencyHPActionRoutes;
