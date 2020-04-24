import React, { useContext } from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import {
  OnboardingStep1Mutation,
  BlankOnboardingStep1Input,
} from "../../queries/OnboardingStep1Mutation";
import { assertNotNull } from "../../util/util";
import { redirectToAddressConfirmationOrNextStep } from "../../ui/address-confirmation";
import { NorentRoutes } from "../routes";
import { HiddenFormField } from "../../forms/form-fields";
import { AddressAndBoroughField } from "../../forms/address-and-borough-form-field";
import { ProgressButtons } from "../../ui/buttons";
import Page from "../../ui/page";
import { Route, Link } from "react-router-dom";
import { AppContext } from "../../app-context";
import {
  isBoroughChoice,
  getBoroughChoiceLabels,
} from "../../../../common-data/borough-choices";
import { Modal, BackOrUpOneDirLevel } from "../../ui/modal";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { OnboardingStep1Input } from "../../queries/globalTypes";
import {
  AptNumberFormFields,
  createAptNumberFormInput,
} from "../../forms/apt-number-form-fields";

const ConfirmNycAddressModal: React.FC<{
  nextStep: string;
}> = ({ nextStep }) => {
  const addrInfo =
    useContext(AppContext).session.onboardingStep1 || BlankOnboardingStep1Input;
  let borough = "";
  if (isBoroughChoice(addrInfo.borough)) {
    borough = getBoroughChoiceLabels()[addrInfo.borough];
  }

  return (
    <Modal
      title="Confirming the address"
      withHeading
      onCloseGoTo={BackOrUpOneDirLevel}
      render={(ctx) => (
        <>
          <p>
            Our records have shown us a similar address. Would you like to
            proceed with this address:
          </p>
          <p className="content is-italic">
            {addrInfo.address}, {borough}
          </p>
          <div className="buttons jf-two-buttons">
            <Link
              {...ctx.getLinkCloseProps()}
              className="jf-is-back-button button is-medium"
            >
              No
            </Link>
            <Link
              to={nextStep}
              className="button is-primary is-medium jf-is-next-button"
            >
              Yes
            </Link>
          </div>
        </>
      )}
    />
  );
};

function getInitialState(s: AllSessionInfo): OnboardingStep1Input {
  return {
    firstName: "ignore",
    lastName: "ignore",
    address: s.onboardingStep1?.address || s.onboardingInfo?.address || "",
    borough: s.onboardingStep1?.borough || s.onboardingInfo?.borough || "",
    ...createAptNumberFormInput(
      s.onboardingStep1?.aptNumber ?? s.onboardingInfo?.aptNumber
    ),
  };
}

export const NorentLbAskNycAddress = MiddleProgressStep((props) => {
  return (
    <Page title="Your residence" withHeading="big">
      <div className="content">
        <p>We'll include this information in the letter to your landlord.</p>
      </div>
      <SessionUpdatingFormSubmitter
        formId="address"
        mutation={OnboardingStep1Mutation}
        initialState={getInitialState}
        onSuccessRedirect={(output, input) =>
          redirectToAddressConfirmationOrNextStep({
            input,
            resolved: assertNotNull(
              assertNotNull(output.session).onboardingStep1
            ),
            nextStep: props.nextStep,
            confirmation: NorentRoutes.locale.letter.nycAddressConfirmModal,
          })
        }
      >
        {(ctx) => (
          <>
            <HiddenFormField {...ctx.fieldPropsFor("firstName")} />
            <HiddenFormField {...ctx.fieldPropsFor("lastName")} />
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
        path={NorentRoutes.locale.letter.nycAddressConfirmModal}
        exact
        render={() => <ConfirmNycAddressModal nextStep={props.nextStep} />}
      />
    </Page>
  );
});
