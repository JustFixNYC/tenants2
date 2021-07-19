import React, { useContext } from "react";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { redirectToAddressConfirmationOrNextStep } from "../ui/address-confirmation";
import { AddressAndBoroughField } from "../forms/address-and-borough-form-field";
import { ProgressButtons } from "../ui/buttons";
import Page from "../ui/page";
import { Route } from "react-router-dom";
import { AppContext } from "../app-context";
import {
  isBoroughChoice,
  getBoroughChoiceLabels,
} from "../../../common-data/borough-choices";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { NycAddressInput } from "../queries/globalTypes";
import {
  AptNumberFormFields,
  createAptNumberFormInput,
} from "../forms/apt-number-form-fields";
import { YesNoConfirmationModal } from "../ui/confirmation-modal";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import { MiddleProgressStepProps } from "../progress/progress-step-route";
import { NycAddressMutation } from "../queries/NycAddressMutation";
import { BlankNorentScaffolding } from "../queries/NorentScaffolding";

const ConfirmNycAddressModal: React.FC<{
  nextStep: string;
}> = ({ nextStep }) => {
  const addrInfo =
    useContext(AppContext).session.norentScaffolding || BlankNorentScaffolding;
  let borough = "";
  if (isBoroughChoice(addrInfo.borough)) {
    borough = getBoroughChoiceLabels()[addrInfo.borough];
  }

  return (
    <YesNoConfirmationModal
      title={li18n._(t`Confirming the address`)}
      nextStep={nextStep}
    >
      <p>
        <Trans>
          Our records have shown us a similar address. Would you like to proceed
          with this address:
        </Trans>
      </p>
      <p className="content is-italic">
        {addrInfo.street}, {borough}
      </p>
    </YesNoConfirmationModal>
  );
};

function getInitialState(s: AllSessionInfo): NycAddressInput {
  return {
    address:
      s.norentScaffolding?.street ||
      s.onboardingStep1?.address ||
      s.onboardingInfo?.address ||
      "",
    borough:
      s.norentScaffolding?.borough ||
      s.onboardingStep1?.borough ||
      s.onboardingInfo?.borough ||
      "",
    ...createAptNumberFormInput(
      s.norentScaffolding?.aptNumber ??
        s.onboardingStep1?.aptNumber ??
        s.onboardingInfo?.aptNumber
    ),
  };
}

export const AskNycAddress: React.FC<
  MiddleProgressStepProps & {
    children: JSX.Element;
    confirmModalRoute: string;
  }
> = (props) => (
  <Page title={li18n._(t`Your residence`)} withHeading="big">
    <div className="content">{props.children}</div>
    <SessionUpdatingFormSubmitter
      formId="address"
      mutation={NycAddressMutation}
      initialState={getInitialState}
      onSuccessRedirect={(output, input) =>
        redirectToAddressConfirmationOrNextStep({
          input,
          resolved: {
            address: output.session?.norentScaffolding?.street ?? "",
            borough: output.session?.norentScaffolding?.borough ?? "",
          },
          nextStep: props.nextStep,
          confirmation: props.confirmModalRoute,
        })
      }
    >
      {(ctx) => (
        <>
          <AddressAndBoroughField
            addressProps={ctx.fieldPropsFor("address")}
            boroughProps={ctx.fieldPropsFor("borough")}
          />
          <AptNumberFormFields
            aptNumberProps={ctx.fieldPropsFor("aptNumber")}
            noAptNumberProps={ctx.fieldPropsFor("noAptNumber")}
          />
          <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
        </>
      )}
    </SessionUpdatingFormSubmitter>
    <Route
      path={props.confirmModalRoute}
      exact
      render={() => <ConfirmNycAddressModal nextStep={props.nextStep} />}
    />
  </Page>
);
