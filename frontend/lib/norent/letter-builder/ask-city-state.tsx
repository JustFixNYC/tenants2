import React, { useContext } from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { NorentCityStateMutation } from "../../queries/NorentCityStateMutation";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { ProgressButtons } from "../../ui/buttons";
import { NorentConfirmationModal } from "./confirmation-modal";
import { AppContext } from "../../app-context";
import { hardFail } from "../../util/util";
import { NorentRoutes } from "../route-info";
import { Route } from "react-router-dom";
import { areAddressesTheSame } from "../../ui/address-confirmation";
import { isUserLoggedIn } from "../../util/session-predicates";
import { NorentAlreadyLoggedInErrorPage } from "./error-pages";
import { CityAndStateField } from "../../forms/city-and-state-form-field";
import { li18n } from "../../i18n-lingui";
import { t, Trans } from "@lingui/macro";

const getConfirmModalRoute = () => NorentRoutes.locale.letter.cityConfirmModal;

const ConfirmCityModal: React.FC<{ nextStep: string }> = (props) => {
  const scf = useContext(AppContext).session.norentScaffolding;

  return (
    <NorentConfirmationModal
      nextStep={props.nextStep}
      title={li18n._(t`Confirming the city`)}
    >
      <p>
        <Trans>
          Do you live in {scf?.city}, {scf?.state}?
        </Trans>
      </p>
    </NorentConfirmationModal>
  );
};

export const NorentLbAskCityState = MiddleProgressStep((props) => {
  if (isUserLoggedIn(useContext(AppContext).session)) {
    return <NorentAlreadyLoggedInErrorPage />;
  }

  return (
    <Page title={li18n._(t`Where do you live?`)} withHeading="big">
      <div className="content">
        <p>
          <Trans>
            We’ll use this information to pull the most up-to-date ordinances
            that protect your rights as a tenant in your letter.
          </Trans>
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
            <CityAndStateField
              cityProps={ctx.fieldPropsFor("city")}
              stateProps={ctx.fieldPropsFor("state")}
            />
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
