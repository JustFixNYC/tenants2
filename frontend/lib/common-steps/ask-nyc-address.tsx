import React, { useContext } from "react";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import {
  OnboardingStep1V2Mutation,
  BlankOnboardingStep1V2Input,
} from "../queries/OnboardingStep1V2Mutation";
import { assertNotNull } from "@justfixnyc/util";
import { redirectToAddressConfirmationOrNextStep } from "../ui/address-confirmation";
import { HiddenFormField } from "../forms/form-fields";
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
import { OnboardingStep1V2Input } from "../queries/globalTypes";
import {
  AptNumberFormFields,
  createAptNumberFormInput,
} from "../forms/apt-number-form-fields";
import { YesNoConfirmationModal } from "../ui/confirmation-modal";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import { MiddleProgressStepProps } from "../progress/progress-step-route";

const ConfirmNycAddressModal: React.FC<{
  nextStep: string;
}> = ({ nextStep }) => {
  const addrInfo =
    useContext(AppContext).session.onboardingStep1 ||
    BlankOnboardingStep1V2Input;
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
        {addrInfo.address}, {borough}
      </p>
    </YesNoConfirmationModal>
  );
};

function getInitialState(s: AllSessionInfo): OnboardingStep1V2Input {
  return {
    firstName: "ignore",
    lastName: "ignore",
    preferredFirstName: "",
    address: s.onboardingStep1?.address || s.onboardingInfo?.address || "",
    borough: s.onboardingStep1?.borough || s.onboardingInfo?.borough || "",
    ...createAptNumberFormInput(
      s.onboardingStep1?.aptNumber ?? s.onboardingInfo?.aptNumber
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
      mutation={OnboardingStep1V2Mutation}
      initialState={getInitialState}
      onSuccessRedirect={(output, input) =>
        redirectToAddressConfirmationOrNextStep({
          input,
          resolved: assertNotNull(
            assertNotNull(output.session).onboardingStep1
          ),
          nextStep: props.nextStep,
          confirmation: props.confirmModalRoute,
        })
      }
    >
      {(ctx) => (
        <>
          <HiddenFormField {...ctx.fieldPropsFor("firstName")} />
          <HiddenFormField {...ctx.fieldPropsFor("lastName")} />
          <HiddenFormField {...ctx.fieldPropsFor("preferredFirstName")} />

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
