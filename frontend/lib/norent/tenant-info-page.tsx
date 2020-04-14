import React, { useRef } from "react";
import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import {
  NorentTenantInfoMutation,
  BlankNorentTenantInfoInput,
} from "../queries/NorentTenantInfoMutation";
import { TextualFormField } from "../forms/form-fields";
import { exactSubsetOrDefault, assertNotNull } from "../util/util";
import { NorentRoutes } from "./routes";
import { USStateFormField } from "../forms/mailing-address-fields";
import { NextButton } from "../ui/buttons";
import { PhoneNumberFormField } from "../forms/phone-number-form-field";
import { ClearSessionButton } from "../forms/clear-session-button";
import { ProgressStepProps } from "../progress/progress-step-route";

export const NorentTenantInfoPage: React.FC<ProgressStepProps> = (props) => {
  const cancelControlRef = useRef(null);

  return (
    <Page title="Your information" withHeading="big" className="content">
      <p>
        We'll use this information to include in the letter to your landlord and
        to email a copy of the letter to you.
      </p>
      <SessionUpdatingFormSubmitter
        mutation={NorentTenantInfoMutation}
        initialState={(s) =>
          exactSubsetOrDefault(s.norentScaffolding, BlankNorentTenantInfoInput)
        }
        onSuccessRedirect={assertNotNull(props.nextStep)}
      >
        {(ctx) => (
          <>
            <TextualFormField
              {...ctx.fieldPropsFor("firstName")}
              label="First name"
            />
            <TextualFormField
              {...ctx.fieldPropsFor("lastName")}
              label="Last name"
            />
            <TextualFormField
              {...ctx.fieldPropsFor("street")}
              label="Street address"
            />
            <TextualFormField {...ctx.fieldPropsFor("city")} label="City" />
            <USStateFormField {...ctx.fieldPropsFor("state")} />
            <TextualFormField
              {...ctx.fieldPropsFor("zipCode")}
              label="Zip code"
            />
            <TextualFormField
              {...ctx.fieldPropsFor("aptNumber")}
              label="Unit/apt/suite"
            />
            <TextualFormField
              type="email"
              {...ctx.fieldPropsFor("email")}
              label="Email address"
            />
            <PhoneNumberFormField
              {...ctx.fieldPropsFor("phoneNumber")}
              label="Phone number"
            />
            <div className="field is-grouped jf-two-buttons">
              <div className="control" ref={cancelControlRef} />
              <NextButton isLoading={ctx.isLoading} />
            </div>
          </>
        )}
      </SessionUpdatingFormSubmitter>
      <ClearSessionButton
        to={NorentRoutes.locale.home}
        portalRef={cancelControlRef}
        label="Cancel letter"
      />
    </Page>
  );
};
