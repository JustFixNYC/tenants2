import React, { useContext } from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import {
  OnboardingStep1Mutation,
  BlankOnboardingStep1Input,
} from "../../queries/OnboardingStep1Mutation";
import { assertNotNull } from "../../util/util";
import {
  redirectToAddressConfirmationOrNextStep,
  ConfirmAddressModal,
} from "../../ui/address-confirmation";
import { NorentRoutes } from "../routes";
import { HiddenFormField, TextualFormField } from "../../forms/form-fields";
import { AddressAndBoroughField } from "../../forms/address-and-borough-form-field";
import { ProgressButtons } from "../../ui/buttons";
import Page from "../../ui/page";
import { Route } from "react-router-dom";
import { AppContext } from "../../app-context";

const ConfirmNycAddressModal: React.FC<{ nextStep: string }> = ({
  nextStep,
}) => {
  const addrInfo =
    useContext(AppContext).session.onboardingStep1 || BlankOnboardingStep1Input;
  return <ConfirmAddressModal nextStep={nextStep} {...addrInfo} />;
};

export const NorentLbAskNycAddress = MiddleProgressStep((props) => {
  return (
    <Page title="Your residence" withHeading="big">
      <div className="content">
        <p>We'll include this information in the letter to your landlord.</p>
      </div>
      <SessionUpdatingFormSubmitter
        formId="address"
        mutation={OnboardingStep1Mutation}
        initialState={(s) => ({
          firstName: "ignore",
          lastName: "ignore",
          address:
            s.onboardingStep1?.address || s.onboardingInfo?.address || "",
          borough:
            s.onboardingStep1?.borough || s.onboardingInfo?.borough || "",
          aptNumber:
            s.onboardingStep1?.aptNumber || s.onboardingInfo?.aptNumber || "",
        })}
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
            <TextualFormField
              label="Apartment number"
              autoComplete="address-line2 street-address"
              {...ctx.fieldPropsFor("aptNumber")}
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
