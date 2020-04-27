import React, { useContext } from "react";

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
import { NorentRoutes } from "../routes";
import { Route } from "react-router-dom";
import { AppContext } from "../../app-context";
import { NorentConfirmationModal } from "./confirmation-modal";
import { BreaksBetweenLines } from "../../ui/breaks-between-lines";

const getConfirmModalRoute = () =>
  NorentRoutes.locale.letter.landlordAddressConfirmModal;

const ConfirmAddressModal: React.FC<{ nextStep: string }> = ({ nextStep }) => {
  const { landlordDetails } = useContext(AppContext).session;

  return (
    <NorentConfirmationModal
      title="Our records tell us that this address is undeliverable."
      nextStep={nextStep}
    >
      <p>Do you still want to mail to:</p>
      <p className="content is-italic">
        <BreaksBetweenLines lines={landlordDetails?.address || ""} />
      </p>
    </NorentConfirmationModal>
  );
};

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
        onSuccessRedirect={(output) =>
          output.isUndeliverable ? getConfirmModalRoute() : props.nextStep
        }
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
      <Route
        path={getConfirmModalRoute()}
        render={() => <ConfirmAddressModal nextStep={props.nextStep} />}
      />
    </Page>
  );
});

export default NorentLandlordMailingAddress;
