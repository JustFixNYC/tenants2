import React, { useContext } from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import {
  NorentNationalAddressMutation,
  NorentNationalAddressMutation_output,
} from "../../queries/NorentNationalAddressMutation";
import { TextualFormField } from "../../forms/form-fields";
import { ProgressButtons } from "../../ui/buttons";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { NorentNationalAddressInput } from "../../queries/globalTypes";
import {
  createAptNumberFormInput,
  AptNumberFormFields,
} from "../../forms/apt-number-form-fields";
import { NorentConfirmationModal } from "./confirmation-modal";
import { AppContext } from "../../app-context";
import { NorentRoutes } from "../routes";
import { Route } from "react-router-dom";
import { areAddressesTheSame } from "../../ui/address-confirmation";
import { hardFail } from "../../util/util";

const getRoutes = () => NorentRoutes.locale.letter;

const ScaffoldingAddress: React.FC<{}> = (props) => {
  const scf = useContext(AppContext).session.norentScaffolding;

  return (
    <p className="content is-italic">
      {scf?.street}
      <br />
      {scf?.city}, {scf?.state} {scf?.zipCode}
    </p>
  );
};

const ConfirmValidAddressModal: React.FC<{ nextStep: string }> = (props) => {
  return (
    <NorentConfirmationModal
      title="Confirming the address"
      nextStep={props.nextStep}
    >
      <p>
        Our records have shown us a similar address. Would you like to proceed
        with this address:
      </p>
      <ScaffoldingAddress />
    </NorentConfirmationModal>
  );
};

const ConfirmInvalidAddressModal: React.FC<{ nextStep: string }> = (props) => {
  return (
    <NorentConfirmationModal
      title="Our records tell us that this address is invalid."
      nextStep={props.nextStep}
    >
      <p>Are you sure you want to proceed with the following address?</p>
      <ScaffoldingAddress />
    </NorentConfirmationModal>
  );
};

function getInitialState(s: AllSessionInfo): NorentNationalAddressInput {
  return {
    street: s.norentScaffolding?.street || s.onboardingInfo?.address || "",
    zipCode: s.norentScaffolding?.zipCode || s.onboardingInfo?.zipcode || "",
    ...createAptNumberFormInput(
      s.norentScaffolding?.aptNumber ?? s.onboardingInfo?.aptNumber
    ),
  };
}

function getSuccessRedirect(
  nextStep: string,
  output: NorentNationalAddressMutation_output,
  input: NorentNationalAddressInput
): string {
  if (output.isValid === false) {
    return getRoutes().nationalAddressConfirmInvalidModal;
  }
  if (output.isValid) {
    const scf = output.session?.norentScaffolding ?? hardFail();
    if (
      !areAddressesTheSame(input.zipCode, scf.zipCode) ||
      !areAddressesTheSame(input.street, scf.street)
    ) {
      return getRoutes().nationalAddressConfirmModal;
    }
  }
  return nextStep;
}

export const NorentLbAskNationalAddress_forUnitTests = {
  ConfirmValidAddressModal,
  ConfirmInvalidAddressModal,
  getSuccessRedirect,
};

export const NorentLbAskNationalAddress = MiddleProgressStep((props) => {
  const onSuccessRedirect = getSuccessRedirect.bind(null, props.nextStep);

  return (
    <Page title="Your residence" withHeading="big">
      <div className="content">
        <p>We'll include this information in the letter to your landlord.</p>
      </div>
      <SessionUpdatingFormSubmitter
        mutation={NorentNationalAddressMutation}
        initialState={getInitialState}
        onSuccessRedirect={onSuccessRedirect}
      >
        {(ctx) => (
          <>
            <TextualFormField
              {...ctx.fieldPropsFor("street")}
              label="Address"
            />
            <AptNumberFormFields
              aptNumberProps={ctx.fieldPropsFor("aptNumber")}
              noAptNumberProps={ctx.fieldPropsFor("noAptNumber")}
              aptNumberLabel="Unit/apt/suite number"
            />
            <TextualFormField
              {...ctx.fieldPropsFor("zipCode")}
              label="Zip code"
            />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
      <Route
        path={getRoutes().nationalAddressConfirmModal}
        render={() => <ConfirmValidAddressModal {...props} />}
      />
      <Route
        path={getRoutes().nationalAddressConfirmInvalidModal}
        render={() => <ConfirmInvalidAddressModal {...props} />}
      />
    </Page>
  );
});
