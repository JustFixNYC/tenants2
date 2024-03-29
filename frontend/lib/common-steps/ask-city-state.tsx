import React, { useContext } from "react";
import Page from "../ui/page";
import { NorentCityStateMutation } from "../queries/NorentCityStateMutation";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { ProgressButtons } from "../ui/buttons";
import { YesNoConfirmationModal } from "../ui/confirmation-modal";
import { AppContext } from "../app-context";
import { hardFail } from "@justfixnyc/util";
import { Route } from "react-router-dom";
import { areAddressesTheSame } from "../ui/address-confirmation";
import { CityAndStateField } from "../forms/city-and-state-form-field";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import { MiddleProgressStepProps } from "../progress/progress-step-route";
import { MapboxCityOptions } from "../forms/mapbox/city-autocomplete";

const ConfirmCityModal: React.FC<{ nextStep: string }> = (props) => {
  const scf = useContext(AppContext).session.onboardingScaffolding;

  return (
    <YesNoConfirmationModal
      nextStep={props.nextStep}
      title={li18n._(t`Confirming the city`)}
    >
      <p>
        <Trans>
          Do you live in {scf?.city}, {scf?.state}?
        </Trans>
      </p>
    </YesNoConfirmationModal>
  );
};

export const AskCityState: React.FC<
  MiddleProgressStepProps & {
    confirmModalRoute: string;
    children: JSX.Element;
  } & MapboxCityOptions
> = (props) => {
  return (
    <Page title={li18n._(t`Where do you live?`)} withHeading="big">
      <div className="content">{props.children}</div>
      <br />
      <SessionUpdatingFormSubmitter
        mutation={NorentCityStateMutation}
        initialState={(s) => ({
          city: s.onboardingScaffolding?.city || s.onboardingInfo?.city || "",
          state:
            s.onboardingScaffolding?.state || s.onboardingInfo?.state || "",
        })}
        onSuccessRedirect={(output, input) =>
          areAddressesTheSame(
            input.city,
            output.session?.onboardingScaffolding?.city ?? hardFail()
          )
            ? props.nextStep
            : props.confirmModalRoute
        }
      >
        {(ctx) => (
          <>
            <CityAndStateField
              cityProps={ctx.fieldPropsFor("city")}
              stateProps={ctx.fieldPropsFor("state")}
              forState={props.forState}
              bbox={props.bbox}
            />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
      <Route
        path={props.confirmModalRoute}
        render={() => <ConfirmCityModal nextStep={props.nextStep} />}
      />
    </Page>
  );
};
