import React from "react";
import { useContext } from "react";
import { Route } from "react-router-dom";
import {
  getLeaseChoiceLabels,
  isLeaseChoice,
  LeaseChoice,
  LeaseChoices,
} from "../../../common-data/lease-choices";
import { AppContext } from "../app-context";
import { toDjangoChoices } from "../common-data";
import { AddressAndBoroughField } from "../forms/address-and-borough-form-field";
import { AptNumberFormFields } from "../forms/apt-number-form-fields";
import { RadiosFormField } from "../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import {
  optionalBooleanToYesNoChoice,
  optionalBooleanToYesNoLabel,
  YesNoRadiosFormField,
} from "../forms/yes-no-radios-form-field";
import { LeaseTypeMutation } from "../queries/LeaseTypeMutation";
import { NycAddressMutation } from "../queries/NycAddressMutation";
import { PublicAssistanceMutation } from "../queries/PublicAssistanceMutation";
import {
  redirectToAddressConfirmationOrNextStep,
  ConfirmAddressModal,
  safeGetAddressAndBorough,
} from "../ui/address-confirmation";
import { EditableInfo, SaveCancelButtons } from "../ui/editable-info";
import { assertNotNull } from "@justfixnyc/util";
import { makeAccountSettingsSection, WithAccountSettingsProps } from "./util";
import {
  HOUSING_TYPE_FIELD_LABEL,
  PUBLIC_ASSISTANCE_QUESTION_TEXT,
} from "../util/housing-type";
import { LeaseType } from "../queries/globalTypes";

const PublicAssistanceField: React.FC<WithAccountSettingsProps> = ({
  routes,
}) => {
  const sec = makeAccountSettingsSection(
    routes,
    "Housing voucher?",
    "public-assistance"
  );
  const { session } = useContext(AppContext);
  const value = session.onboardingInfo?.receivesPublicAssistance ?? null;
  const valueLabel = optionalBooleanToYesNoLabel(value);

  return (
    <>
      {sec.heading}
      <p>
        For example, Section 8 [Housing Choice Program], FHEPS, CITYFHEPS, HASA,
        etc.
      </p>
      <EditableInfo
        {...sec}
        readonlyContent={valueLabel}
        path={routes.publicAssistance}
      >
        <SessionUpdatingFormSubmitter
          mutation={PublicAssistanceMutation}
          onSuccessRedirect={sec.homeLink}
          initialState={{
            receivesPublicAssistance: optionalBooleanToYesNoChoice(value),
          }}
        >
          {(ctx) => (
            <>
              <YesNoRadiosFormField
                {...ctx.fieldPropsFor("receivesPublicAssistance")}
                autoFocus
                hideVisibleLabel
                label={PUBLIC_ASSISTANCE_QUESTION_TEXT}
              />
              <SaveCancelButtons isLoading={ctx.isLoading} {...sec} />
            </>
          )}
        </SessionUpdatingFormSubmitter>
      </EditableInfo>
    </>
  );
};

function filterLeaseChoices(
  leaseType: "" | LeaseType,
  choices: [LeaseChoice, string][]
) {
  let filteredChoices = [...choices];

  // If the user previously onboarded and chose the "No lease" or "Rent stabilized
  // or controlled" options, which have since been deprecated, we still want them
  // to be able to see it and choose it. However, if they didn't pick that option,
  // we don't want them to be able to choose it now.
  if (leaseType !== "NO_LEASE") {
    filteredChoices = filteredChoices.filter(
      ([choice, _]) => choice !== "NO_LEASE"
    );
  }
  if (leaseType !== "RENT_STABILIZED_OR_CONTROLLED") {
    filteredChoices = filteredChoices.filter(
      ([choice, _]) => choice !== "RENT_STABILIZED_OR_CONTROLLED"
    );
  }
  return filteredChoices;
}

const LeaseTypeField: React.FC<WithAccountSettingsProps> = ({ routes }) => {
  const sec = makeAccountSettingsSection(
    routes,
    HOUSING_TYPE_FIELD_LABEL,
    "lease"
    // Route will stay "lease" even though all other user-facing strings have been changed to
    // "housing type" to preserve backwards compatibility.
  );
  const { session } = useContext(AppContext);
  const leaseType = session.onboardingInfo?.leaseType || "";
  let choices = toDjangoChoices(LeaseChoices, getLeaseChoiceLabels());
  let leaseTypeLabel = "";
  if (isLeaseChoice(leaseType)) {
    leaseTypeLabel = getLeaseChoiceLabels()[leaseType];
    choices = filterLeaseChoices(leaseType, choices);
  }

  return (
    <>
      {sec.heading}
      <EditableInfo
        {...sec}
        readonlyContent={leaseTypeLabel}
        path={routes.leaseType}
      >
        <SessionUpdatingFormSubmitter
          mutation={LeaseTypeMutation}
          onSuccessRedirect={sec.homeLink}
          initialState={{ leaseType }}
        >
          {(ctx) => (
            <>
              <RadiosFormField
                {...ctx.fieldPropsFor("leaseType")}
                autoFocus
                choices={choices}
                label={HOUSING_TYPE_FIELD_LABEL}
              />
              <SaveCancelButtons isLoading={ctx.isLoading} {...sec} />
            </>
          )}
        </SessionUpdatingFormSubmitter>
      </EditableInfo>
    </>
  );
};

const OurConfirmAddressModal: React.FC<{ homeLink: string }> = ({
  homeLink,
}) => {
  const { session } = useContext(AppContext);
  const addrInfo = safeGetAddressAndBorough(session.onboardingInfo);
  return <ConfirmAddressModal nextStep={homeLink} {...addrInfo} />;
};

const NycAddressField: React.FC<WithAccountSettingsProps> = ({ routes }) => {
  const sec = makeAccountSettingsSection(routes, "Your address", "address");
  const oi = assertNotNull(useContext(AppContext).session.onboardingInfo);

  return (
    <>
      {sec.heading}
      <EditableInfo
        {...sec}
        readonlyContent={oi.fullMailingAddress}
        path={routes.address}
      >
        <SessionUpdatingFormSubmitter
          mutation={NycAddressMutation}
          initialState={{
            borough: assertNotNull(oi.borough),
            aptNumber: oi.aptNumber,
            noAptNumber: !oi.aptNumber,
            address: oi.address,
          }}
          onSuccessRedirect={(output, input) =>
            redirectToAddressConfirmationOrNextStep({
              input,
              resolved: safeGetAddressAndBorough(
                output.session?.onboardingInfo
              ),
              confirmation: routes.confirmAddressModal,
              nextStep: sec.homeLink,
            })
          }
        >
          {(ctx) => (
            <>
              <AddressAndBoroughField
                autoFocus
                addressProps={ctx.fieldPropsFor("address")}
                boroughProps={ctx.fieldPropsFor("borough")}
              />
              <AptNumberFormFields
                aptNumberProps={ctx.fieldPropsFor("aptNumber")}
                noAptNumberProps={ctx.fieldPropsFor("noAptNumber")}
              />
              <SaveCancelButtons isLoading={ctx.isLoading} {...sec} />
            </>
          )}
        </SessionUpdatingFormSubmitter>
      </EditableInfo>
      <Route
        path={routes.confirmAddressModal}
        exact
        render={() => <OurConfirmAddressModal {...sec} />}
      />
    </>
  );
};

export const NycAddressAccountSettings: React.FC<WithAccountSettingsProps> = (
  props
) => {
  return (
    <>
      <h2 className="jf-account-settings-h2">Address</h2>
      <NycAddressField {...props} />
      <LeaseTypeField {...props} />
      <PublicAssistanceField {...props} />
    </>
  );
};
