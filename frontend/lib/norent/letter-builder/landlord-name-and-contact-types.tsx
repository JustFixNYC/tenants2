import React, { useContext } from "react";
import Page from "../../ui/page";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { TextualFormField, CheckboxFormField } from "../../forms/form-fields";
import { ProgressButtons, ProgressButtonsAsLinks } from "../../ui/buttons";
import { MiddleProgressStepProps } from "../../progress/progress-step-route";
import { NorentLandlordNameAndContactTypesMutation } from "../../queries/NorentLandlordNameAndContactTypesMutation";
import { AllSessionInfo_landlordDetails } from "../../queries/AllSessionInfo";
import { AppContext } from "../../app-context";
import { LetterBuilderAccordion } from "./welcome";
import { BreaksBetweenLines } from "../../ui/breaks-between-lines";
import { NorentNotSentLetterStep } from "./step-decorators";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../../i18n-lingui";

const ReadOnlyLandlordDetails: React.FC<
  MiddleProgressStepProps & { details: AllSessionInfo_landlordDetails }
> = ({ details, nextStep, prevStep }) => {
  return (
    <div className="content">
      <Trans id="norent.detailsAboutNYCLandlordInfo">
        <p>
          This is your landlord’s information as registered with the{" "}
          <b>NYC Department of Housing and Preservation (HPD)</b>. This may be
          different than where you send your rent checks.
        </p>
        <p>We will use this address to ensure your landlord receives it.</p>
      </Trans>
      <dl>
        <dt>
          <strong>
            <Trans>Landlord name</Trans>
          </strong>
        </dt>
        <dd>{details.name}</dd>
        <br />
        <dt>
          <strong>
            <Trans>Landlord address</Trans>
          </strong>
        </dt>
        <dd>
          <BreaksBetweenLines lines={details.address} />
        </dd>
      </dl>
      <ProgressButtonsAsLinks back={prevStep} next={nextStep} />
    </div>
  );
};

const NameAndContactTypesForm: React.FC<MiddleProgressStepProps> = (props) => (
  <>
    <p className="jf-space-below-2rem">
      <Trans>We'll use this information to send your letter.</Trans>
    </p>
    <br />
    <SessionUpdatingFormSubmitter
      mutation={NorentLandlordNameAndContactTypesMutation}
      initialState={(s) => ({
        name: s.landlordDetails?.name || "",
        hasEmailAddress:
          s.norentScaffolding?.hasLandlordEmailAddress ??
          !!s.landlordDetails?.email,
        hasMailingAddress:
          s.norentScaffolding?.hasLandlordMailingAddress ??
          !!s.landlordDetails?.address,
      })}
      onSuccessRedirect={props.nextStep}
    >
      {(ctx) => (
        <>
          <TextualFormField
            {...ctx.fieldPropsFor("name")}
            label={li18n._(t`Landlord/management company's name`)}
          />
          <LetterBuilderAccordion
            question={li18n._(t`Where do I find this information?`)}
          >
            <Trans>
              If you write checks or transfer money through your bank to pay
              your rent, use that name here.
            </Trans>
          </LetterBuilderAccordion>
          <p>
            <Trans>
              What contact information do you have for your landlord or building
              management?{" "}
              <span className="has-text-weight-bold">
                Choose all that apply.
              </span>
            </Trans>
          </p>
          <CheckboxFormField {...ctx.fieldPropsFor("hasEmailAddress")}>
            <Trans>
              Email address{" "}
              <span className="has-text-weight-bold">(recommended)</span>
            </Trans>
          </CheckboxFormField>
          <CheckboxFormField {...ctx.fieldPropsFor("hasMailingAddress")}>
            <Trans>Mailing address</Trans>
          </CheckboxFormField>
          <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
        </>
      )}
    </SessionUpdatingFormSubmitter>
  </>
);

export const NorentLandlordNameAndContactTypes = NorentNotSentLetterStep(
  (props) => {
    const { session } = useContext(AppContext);
    return (
      <Page
        title={li18n._(t`Your landlord or management company's information`)}
        withHeading="big"
        className="content"
      >
        {session.landlordDetails?.isLookedUp ? (
          <ReadOnlyLandlordDetails
            {...props}
            details={session.landlordDetails}
          />
        ) : (
          <NameAndContactTypesForm {...props} />
        )}
      </Page>
    );
  }
);
