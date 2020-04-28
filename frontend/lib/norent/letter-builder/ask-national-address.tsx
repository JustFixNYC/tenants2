import React, { useContext } from "react";
import Page from "../../ui/page";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import {
  NorentNationalAddressMutation,
  NorentNationalAddressMutation_output,
} from "../../queries/NorentNationalAddressMutation";
import { TextualFormField } from "../../forms/form-fields";
import { ProgressButtons } from "../../ui/buttons";
import {
  AllSessionInfo,
  AllSessionInfo_norentScaffolding,
} from "../../queries/AllSessionInfo";
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
import { BreaksBetweenLines } from "../../ui/breaks-between-lines";
import { useIsOnboardingUserInStateWithProtections } from "./national-metadata";
import { NorentOnboardingStep } from "./step-decorators";

const getRoutes = () => NorentRoutes.locale.letter;

function getNationalAddressLines(
  scf: AllSessionInfo_norentScaffolding
): string[] {
  const firstLineParts = [scf.street];

  if (scf.aptNumber) {
    firstLineParts.push(`#${scf.aptNumber}`);
  }

  return [firstLineParts.join(" "), `${scf.city}, ${scf.state} ${scf.zipCode}`];
}

const ScaffoldingAddress: React.FC<{}> = (props) => {
  const { norentScaffolding } = useContext(AppContext).session;
  if (!norentScaffolding) return null;

  const addr = getNationalAddressLines(norentScaffolding);

  return (
    <p className="content is-italic">
      <BreaksBetweenLines lines={addr} />
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
  getNationalAddressLines,
};

export const NorentLbAskNationalAddress = NorentOnboardingStep((props) => {
  const onSuccessRedirect = getSuccessRedirect.bind(null, props.nextStep);
  const isWritingLetter = useIsOnboardingUserInStateWithProtections();

  return (
    <Page title="Your residence" withHeading="big">
      <div className="content">
        {isWritingLetter ? (
          <p>We'll include this information in the letter to your landlord.</p>
        ) : (
          <p>
            We’ll use this to reference the latest policies that protect your
            rights as a tenant.
          </p>
        )}
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
