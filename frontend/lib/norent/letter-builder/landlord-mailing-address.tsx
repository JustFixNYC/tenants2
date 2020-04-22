import React from "react";

import Page from "../../ui/page";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { TextualFormField, HiddenFormField } from "../../forms/form-fields";

import { ProgressButtons } from "../../ui/buttons";
import { exactSubsetOrDefault } from "../../util/util";
import {
  LandlordDetailsV2Mutation,
  BlankLandlordDetailsV2Input,
} from "../../queries/LandlordDetailsV2Mutation";
import { USStateFormField } from "../../forms/mailing-address-fields";
import { MiddleProgressStep } from "../../progress/progress-step-route";

const NorentLandlordMailingAddress = MiddleProgressStep((props) => {
  return (
    <Page
      title="Your landlord or management company's address"
      withHeading="big"
      className="content"
    >
      <p>We'll use this information to send your letter.</p>
      <SessionUpdatingFormSubmitter
        mutation={LandlordDetailsV2Mutation}
        initialState={(session) =>
          exactSubsetOrDefault(
            session.landlordDetails,
            BlankLandlordDetailsV2Input
          )
        }
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <>
            <HiddenFormField {...ctx.fieldPropsFor("name")} />
            <TextualFormField
              {...ctx.fieldPropsFor("primaryLine")}
              label="Street address"
            />
            <TextualFormField {...ctx.fieldPropsFor("city")} label="City" />
            <USStateFormField {...ctx.fieldPropsFor("state")} />
            <TextualFormField
              {...ctx.fieldPropsFor("zipCode")}
              label="Zip code"
            />
            <ProgressButtons back={props.prevStep} isLoading={ctx.isLoading} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});

export default NorentLandlordMailingAddress;
