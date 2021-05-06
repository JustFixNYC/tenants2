import React, { useContext } from "react";
import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import {
  NorentNationalAddressMutation,
  NorentNationalAddressMutation_output,
} from "../queries/NorentNationalAddressMutation";
import { TextualFormField } from "../forms/form-fields";
import { ProgressButtons } from "../ui/buttons";
import {
  AllSessionInfo,
  AllSessionInfo_norentScaffolding,
} from "../queries/AllSessionInfo";
import { NorentNationalAddressInput } from "../queries/globalTypes";
import {
  createAptNumberFormInput,
  AptNumberFormFields,
} from "../forms/apt-number-form-fields";
import { YesNoConfirmationModal } from "../ui/confirmation-modal";
import { AppContext } from "../app-context";
import { Link, Route } from "react-router-dom";
import { areAddressesTheSame } from "../ui/address-confirmation";
import { hardFail } from "@justfixnyc/util";
import { BreaksBetweenLines } from "../ui/breaks-between-lines";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import { MiddleProgressStepProps } from "../progress/progress-step-route";

function getNationalAddressLines(
  scf: AllSessionInfo_norentScaffolding
): string[] {
  const firstLineParts = [scf.street];

  if (scf.aptNumber) {
    firstLineParts.push(`#${scf.aptNumber}`);
  }

  return [firstLineParts.join(" "), `${scf.city}, ${scf.state} ${scf.zipCode}`];
}

const ScaffoldingAddress: React.FC<{}> = (props) => {
  const { norentScaffolding } = useContext(AppContext).session;
  if (!norentScaffolding) return null;

  const addr = getNationalAddressLines(norentScaffolding);

  return (
    <p className="content is-italic">
      <BreaksBetweenLines lines={addr} />
    </p>
  );
};

const ConfirmValidAddressModal: React.FC<{ nextStep: string }> = (props) => {
  return (
    <YesNoConfirmationModal
      title={li18n._(t`Confirming the address`)}
      nextStep={props.nextStep}
    >
      <p>
        <Trans>
          Our records have shown us a similar address. Would you like to proceed
          with this address:
        </Trans>
      </p>
      <ScaffoldingAddress />
    </YesNoConfirmationModal>
  );
};

const ConfirmInvalidAddressModal: React.FC<{ nextStep: string }> = (props) => {
  return (
    <YesNoConfirmationModal
      title={li18n._(t`Our records tell us that this address is invalid.`)}
      nextStep={props.nextStep}
    >
      <p>
        <Trans>
          Are you sure you want to proceed with the following address?
        </Trans>
      </p>
      <ScaffoldingAddress />
    </YesNoConfirmationModal>
  );
};

function getInitialState(s: AllSessionInfo): NorentNationalAddressInput {
  return {
    street: s.norentScaffolding?.street || s.onboardingInfo?.address || "",
    zipCode: s.norentScaffolding?.zipCode || s.onboardingInfo?.zipcode || "",
    ...createAptNumberFormInput(
      s.norentScaffolding?.aptNumber ?? s.onboardingInfo?.aptNumber
    ),
  };
}

function getSuccessRedirect(
  routes: NationalAddressModalRoutes,
  nextStep: string,
  output: NorentNationalAddressMutation_output,
  input: NorentNationalAddressInput
): string {
  if (output.isValid === false) {
    return routes.nationalAddressConfirmInvalidModal;
  }
  if (output.isValid) {
    const scf = output.session?.norentScaffolding ?? hardFail();
    if (
      !areAddressesTheSame(input.zipCode, scf.zipCode) ||
      !areAddressesTheSame(input.street, scf.street)
    ) {
      return routes.nationalAddressConfirmModal;
    }
  }
  return nextStep;
}

export const AskNationalAddress_forUnitTests = {
  ConfirmValidAddressModal,
  ConfirmInvalidAddressModal,
  getSuccessRedirect,
  getNationalAddressLines,
};

export type NationalAddressModalRoutes = {
  nationalAddressConfirmModal: string;
  nationalAddressConfirmInvalidModal: string;
};

const ReadonlyCityAndStateField: React.FC<{
  changeURL: string;
}> = ({ changeURL }) => {
  const { session } = useContext(AppContext);
  const scf = session.norentScaffolding;

  if (!(scf?.city && scf?.state)) return null;

  const cityAndState = `${scf.city}, ${scf.state}`;

  return (
    <div className="field">
      <span className="label">
        <Trans>City and state</Trans>
      </span>
      <div className="control">
        {cityAndState}{" "}
        <Link to={changeURL} className="jf-change-readonly-value">
          <span
            aria-label={li18n._(t`Change city and state from ${cityAndState}`)}
          >
            <Trans>Change</Trans>
          </span>
        </Link>
      </div>
    </div>
  );
};

export const AskNationalAddress: React.FC<
  MiddleProgressStepProps & {
    children: JSX.Element;
    routes: NationalAddressModalRoutes;
  }
> = (props) => (
  <Page title={li18n._(t`Your residence`)} withHeading="big">
    <div className="content">{props.children}</div>
    <SessionUpdatingFormSubmitter
      mutation={NorentNationalAddressMutation}
      initialState={getInitialState}
      onSuccessRedirect={getSuccessRedirect.bind(
        null,
        props.routes,
        props.nextStep
      )}
    >
      {(ctx) => (
        <>
          <TextualFormField
            {...ctx.fieldPropsFor("street")}
            label={li18n._(t`Address`)}
          />
          <AptNumberFormFields
            aptNumberProps={ctx.fieldPropsFor("aptNumber")}
            noAptNumberProps={ctx.fieldPropsFor("noAptNumber")}
            aptNumberLabel={li18n._(t`Unit/apt/lot/suite number`)}
          />
          <ReadonlyCityAndStateField changeURL={props.prevStep} />
          <TextualFormField
            {...ctx.fieldPropsFor("zipCode")}
            label={li18n._(t`Zip code`)}
          />
          <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
        </>
      )}
    </SessionUpdatingFormSubmitter>
    <Route
      path={props.routes.nationalAddressConfirmModal}
      render={() => <ConfirmValidAddressModal {...props} />}
    />
    <Route
      path={props.routes.nationalAddressConfirmInvalidModal}
      render={() => <ConfirmInvalidAddressModal {...props} />}
    />
  </Page>
);
