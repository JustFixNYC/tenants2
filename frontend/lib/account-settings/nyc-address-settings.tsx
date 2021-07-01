import React from "react";
import { useContext } from "react";
import { Route } from "react-router-dom";
import {
  getLeaseChoiceLabels,
  isLeaseChoice,
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
      <p>For example, section 8, FEPS, Link, HASA, etc.</p>
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
                label="Do you receive a housing voucher (Section 8, FEPS, Link, HASA, other)?"
              />
              <SaveCancelButtons isLoading={ctx.isLoading} {...sec} />
            </>
          )}
        </SessionUpdatingFormSubmitter>
      </EditableInfo>
    </>
  );
};

const LeaseTypeField: React.FC<WithAccountSettingsProps> = ({ routes }) => {
  const sec = makeAccountSettingsSection(routes, "Housing type", "lease");
  const { session } = useContext(AppContext);
  const leaseType = session.onboardingInfo?.leaseType || "";
  let leaseTypeLabel = "";
  if (isLeaseChoice(leaseType)) {
    leaseTypeLabel = getLeaseChoiceLabels()[leaseType];
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
                choices={toDjangoChoices(LeaseChoices, getLeaseChoiceLabels())}
                label="Housing type"
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
