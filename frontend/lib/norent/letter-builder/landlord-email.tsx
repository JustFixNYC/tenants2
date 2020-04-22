import React from "react";
import { OptionalLandlordDetailsMutation } from "../../queries/OptionalLandlordDetailsMutation";
import Page from "../../ui/page";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { TextualFormField, HiddenFormField } from "../../forms/form-fields";
import { ProgressButtons } from "../../ui/buttons";

export const NorentLandlordEmail = MiddleProgressStep((props) => {
  return (
    <Page
      title="Your landlord or management company's email"
      withHeading="big"
      className="content"
    >
      <p>We'll use this information to send your letter.</p>
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
              label="Landlord/management company's email"
            />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
