import React, { useContext } from "react";
import { OptionalLandlordDetailsMutation } from "../../queries/OptionalLandlordDetailsMutation";
import Page from "../../ui/page";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { TextualFormField, HiddenFormField } from "../../forms/form-fields";
import { ProgressButtons } from "../../ui/buttons";
import { AppContext } from "../../app-context";

export const NorentLandlordEmail = MiddleProgressStep((props) => {
  const { session } = useContext(AppContext);
  const required = !session.landlordDetails?.isLookedUp;

  return (
    <Page
      title="Your landlord or management company's email"
      withHeading="big"
      className="content"
    >
      <p>
        We'll use this information to send your letter.{" "}
        {!required && <>This is optional.</>}
      </p>
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
              label={`Landlord/management company's email${
                required ? "" : "(optional)"
              }`}
            />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
