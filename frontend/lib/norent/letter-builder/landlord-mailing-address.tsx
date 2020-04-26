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
import { Route, Link } from "react-router-dom";
import { Modal, BackOrUpOneDirLevel } from "../../ui/modal";
import { AppContext } from "../../app-context";

const getConfirmModalRoute = () =>
  NorentRoutes.locale.letter.landlordAddressConfirmModal;

function splitLines(text: string): JSX.Element[] {
  return text.split("\n").map((line, i) => <div key={i}>{line}</div>);
}

const ConfirmAddressModal: React.FC<{ nextStep: string }> = ({ nextStep }) => {
  const { landlordDetails } = useContext(AppContext).session;

  return (
    <Modal
      title="Our records tell us that this address is undeliverable."
      withHeading
      onCloseGoTo={BackOrUpOneDirLevel}
      render={(ctx) => (
        <>
          <p>Do you still want to mail to:</p>
          {splitLines(landlordDetails?.address || "")}
          <div className="buttons jf-two-buttons">
            <Link
              {...ctx.getLinkCloseProps()}
              className="jf-is-back-button button is-medium"
            >
              Back
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
