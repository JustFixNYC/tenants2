import React, { useContext } from "react";
import { OptionalLandlordDetailsMutation } from "../../queries/OptionalLandlordDetailsMutation";
import Page from "../../ui/page";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { TextualFormField, HiddenFormField } from "../../forms/form-fields";
import { ProgressButtons } from "../../ui/buttons";
import { AppContext } from "../../app-context";
import { NorentNotSentLetterStep } from "./step-decorators";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../../i18n-lingui";

export const NorentLandlordEmail = NorentNotSentLetterStep((props) => {
  const { session } = useContext(AppContext);
  const required = !session.landlordDetails?.isLookedUp;

  return (
    <Page
      title={li18n._(t`Your landlord or management company's email`)}
      withHeading="big"
      className="content"
    >
      <p>
        <Trans>We'll use this information to send your letter.</Trans>{" "}
        {!required && (
          <>
            <Trans>This is optional.</Trans>
          </>
        )}
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
              label={
                li18n._(t`Landlord/management company's email`) + required
                  ? ""
                  : " " + li18n._(t`(optional)`)
              }
            />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
