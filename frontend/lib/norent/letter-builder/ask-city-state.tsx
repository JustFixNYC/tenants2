import React, { useContext } from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { NorentCityStateMutation } from "../../queries/NorentCityStateMutation";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { TextualFormField } from "../../forms/form-fields";
import { USStateFormField } from "../../forms/mailing-address-fields";
import { ProgressButtons } from "../../ui/buttons";
import { NorentConfirmationModal } from "./confirmation-modal";
import { AppContext } from "../../app-context";
import { hardFail } from "../../util/util";
import { NorentRoutes } from "../routes";
import { Route } from "react-router-dom";
import { areAddressesTheSame } from "../../ui/address-confirmation";
import { isUserLoggedIn } from "../../util/session-predicates";
import { NorentAlreadyLoggedInErrorPage } from "./error-pages";

const getConfirmModalRoute = () => NorentRoutes.locale.letter.cityConfirmModal;

const ConfirmCityModal: React.FC<{ nextStep: string }> = (props) => {
  const scf = useContext(AppContext).session.norentScaffolding;

  return (
    <NorentConfirmationModal
      nextStep={props.nextStep}
      title="Confirming the city"
    >
      <p>
        Do you live in {scf?.city}, {scf?.state}?
      </p>
    </NorentConfirmationModal>
  );
};

export const NorentLbAskCityState = MiddleProgressStep((props) => {
  if (isUserLoggedIn(useContext(AppContext).session)) {
    return <NorentAlreadyLoggedInErrorPage />;
  }

  return (
    <Page title="Your city" withHeading="big">
      <div className="content">
        <p>
          We’ll use this information to pull the most up-to-date ordinances that
          protect your rights as a tenant in your letter.
        </p>
      </div>
      <br />
      <SessionUpdatingFormSubmitter
        mutation={NorentCityStateMutation}
        initialState={(s) => ({
          city: s.norentScaffolding?.city || s.onboardingInfo?.city || "",
          state: s.norentScaffolding?.state || s.onboardingInfo?.state || "",
        })}
        onSuccessRedirect={(output, input) =>
          areAddressesTheSame(
            input.city,
            output.session?.norentScaffolding?.city ?? hardFail()
          )
            ? props.nextStep
            : getConfirmModalRoute()
        }
      >
        {(ctx) => (
          <>
            <TextualFormField {...ctx.fieldPropsFor("city")} label="City" />
            <USStateFormField {...ctx.fieldPropsFor("state")} />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
      <Route
        path={getConfirmModalRoute()}
        render={() => <ConfirmCityModal nextStep={props.nextStep} />}
      />
    </Page>
  );
});
