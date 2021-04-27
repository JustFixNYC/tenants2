import React, { useContext } from "react";

import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { TextualFormField, HiddenFormField } from "../forms/form-fields";

import { ProgressButtons } from "../ui/buttons";
import { exactSubsetOrDefault } from "../util/util";
import {
  LandlordDetailsV2Mutation,
  BlankLandlordDetailsV2Input,
} from "../queries/LandlordDetailsV2Mutation";
import { USStateFormField } from "../forms/mailing-address-fields";
import { Route } from "react-router-dom";
import { AppContext } from "../app-context";
import { YesNoConfirmationModal } from "../ui/confirmation-modal";
import { BreaksBetweenLines } from "../ui/breaks-between-lines";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import { DemoDeploymentNote } from "../ui/demo-deployment-note";
import { MiddleProgressStepProps } from "../progress/progress-step-route";
import { AllSessionInfo } from "../queries/AllSessionInfo";

const ConfirmAddressModal: React.FC<{ nextStep: string }> = ({ nextStep }) => {
  const { landlordDetails } = useContext(AppContext).session;

  return (
    <YesNoConfirmationModal
      title={li18n._(
        t`Our records tell us that this address is undeliverable.`
      )}
      nextStep={nextStep}
    >
      <p>
        <Trans>Do you still want to mail to:</Trans>
      </p>
      <p className="content is-italic">
        <BreaksBetweenLines lines={landlordDetails?.address || ""} />
      </p>
    </YesNoConfirmationModal>
  );
};

const LandlordMailingAddress: React.FC<
  MiddleProgressStepProps & {
    confirmModalRoute: string;
    children: JSX.Element;
  }
> = (props) => (
  <Page
    title={li18n._(t`Your landlord or management company's address`)}
    withHeading="big"
    className="content"
  >
    {props.children}
    <DemoDeploymentNote>
      <p>
        This demo site <strong>will not send</strong> real mail to your landlord
        at the address provided below.
      </p>
    </DemoDeploymentNote>
    <SessionUpdatingFormSubmitter
      mutation={LandlordDetailsV2Mutation}
      initialState={(session) =>
        exactSubsetOrDefault(
          session.landlordDetails,
          BlankLandlordDetailsV2Input
        )
      }
      onSuccessRedirect={(output) =>
        output.isUndeliverable ? props.confirmModalRoute : props.nextStep
      }
    >
      {(ctx) => (
        <>
          <HiddenFormField {...ctx.fieldPropsFor("name")} />
          <TextualFormField
            {...ctx.fieldPropsFor("primaryLine")}
            label={li18n._(t`Street address (include unit/suite/floor/apt #)`)}
          />
          <TextualFormField
            {...ctx.fieldPropsFor("city")}
            label={li18n._(t`City`)}
          />
          <USStateFormField {...ctx.fieldPropsFor("state")} />
          <TextualFormField
            {...ctx.fieldPropsFor("zipCode")}
            label={li18n._(t`Zip code`)}
          />
          <ProgressButtons back={props.prevStep} isLoading={ctx.isLoading} />
        </>
      )}
    </SessionUpdatingFormSubmitter>
    <Route
      path={props.confirmModalRoute}
      render={() => <ConfirmAddressModal nextStep={props.nextStep} />}
    />
  </Page>
);

export default LandlordMailingAddress;

export function shouldSkipLandlordMailingAddressStep(
  s: AllSessionInfo
): boolean {
  return s.landlordDetails?.isLookedUp
    ? true
    : !s.norentScaffolding?.hasLandlordMailingAddress;
}
