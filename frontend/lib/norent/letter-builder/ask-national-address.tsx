import React from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { NorentNationalAddressMutation } from "../../queries/NorentNationalAddressMutation";
import { TextualFormField } from "../../forms/form-fields";
import { ProgressButtons } from "../../ui/buttons";
import { AppContext } from "../../app-context";
import { Modal, BackOrUpOneDirLevel } from "../../ui/modal";
import { Link, Route } from "react-router-dom";
import { NorentRoutes } from "../routes";

import * as stateLegislation from "../../../../common-data/norent-state-law-for-builder.json";

const KyrModal: React.FC<{ nextStep: string }> = (props: {
  nextStep: string;
}) => {
  const { session } = useContext(AppContext);
  const norent = session.norentScaffolding;

  return (
    <Modal
      title="Know your rights"
      onCloseGoTo={BackOrUpOneDirLevel}
      render={(ctx) => (
        <>
          <h2 className="title">
            Looks like you're in{" "}
            <span className="has-text-info">
              {norent?.city}, {norent?.state}
            </span>
          </h2>

          {/* REPLACE: Typescript isn't allowing me call the state property dynamically on the json blob... 
          This is a placeholder for now to show the modal content */}

          <p>{stateLegislation.FL["Text of Legislation"]}</p>
          <p>
            We’ve partnered with Community Justice Partners to provide
            additional support once you’ve sent your letter.
          </p>
          <br />
          <div className="has-text-centered">
            <Link
              to={props.nextStep}
              className="button is-medium jf-is-next-button is-primary"
            >
              Continue
            </Link>
          </div>
        </>
      )}
    />
  );
};

export const NorentLbAskNationalAddress = MiddleProgressStep((props) => {
  return (
    <Page title="Your residence" withHeading="big">
      <div className="content">
        <p>We'll include this information in the letter to your landlord.</p>
      </div>
      <SessionUpdatingFormSubmitter
        mutation={NorentNationalAddressMutation}
        initialState={(s) => ({
          street:
            s.norentScaffolding?.street || s.onboardingInfo?.address || "",
          aptNumber:
            s.norentScaffolding?.aptNumber || s.onboardingInfo?.aptNumber || "",
          zipCode:
            s.norentScaffolding?.zipCode || s.onboardingInfo?.zipcode || "",
        })}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <>
            <TextualFormField
              {...ctx.fieldPropsFor("street")}
              label="Address"
            />
            <TextualFormField
              {...ctx.fieldPropsFor("aptNumber")}
              label="Unit/apt/suite number"
            />
            <TextualFormField
              {...ctx.fieldPropsFor("zipCode")}
              label="Zip code"
            />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
      <Route
        path={NorentRoutes.locale.letter.nationalAddressModal}
        exact
        render={() => <KyrModal nextStep={props.nextStep} />}
      />
    </Page>
  );
});
