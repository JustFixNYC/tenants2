import React, { useContext } from "react";
import { OptionalLandlordDetailsMutation } from "../queries/OptionalLandlordDetailsMutation";
import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { TextualFormField, HiddenFormField } from "../forms/form-fields";
import { ProgressButtons } from "../ui/buttons";
import { AppContext } from "../app-context";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";
import { DemoDeploymentNote } from "../ui/demo-deployment-note";
import { MiddleProgressStepProps } from "../progress/progress-step-route";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { optionalizeLabelIf } from "../forms/optionalize-label";

export const LandlordEmail: React.FC<
  MiddleProgressStepProps & {
    introText: string | JSX.Element;
  }
> = (props) => {
  const { session } = useContext(AppContext);
  const required = !session.landlordDetails?.isLookedUp;

  return (
    <Page
      title={li18n._(t`Your landlord or management company's email`)}
      withHeading="big"
      className="content"
    >
      <p>
        {props.introText}{" "}
        {!required && (
          <>
            <Trans>This is optional.</Trans>
          </>
        )}
      </p>
      <DemoDeploymentNote>
        <p>
          This demo site <strong>will not send</strong> real emails to the
          address provided below.
        </p>
      </DemoDeploymentNote>
      <SessionUpdatingFormSubmitter
        mutation={OptionalLandlordDetailsMutation}
        initialState={(s) => ({
          email: s.landlordDetails?.email || "",
          phoneNumber: s.landlordDetails?.phoneNumber || "",
        })}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <>
            <HiddenFormField {...ctx.fieldPropsFor("phoneNumber")} />
            <TextualFormField
              type="email"
              {...ctx.fieldPropsFor("email")}
              required={required}
              label={optionalizeLabelIf(
                li18n._(t`Landlord/management company's email`),
                !required
              )}
            />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
};

export function shouldSkipLandlordEmailStep(s: AllSessionInfo): boolean {
  return s.landlordDetails?.isLookedUp
    ? false
    : !s.norentScaffolding?.hasLandlordEmailAddress;
}
