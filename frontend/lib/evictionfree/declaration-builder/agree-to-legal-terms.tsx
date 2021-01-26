import { t, Trans } from "@lingui/macro";
import React from "react";
import { CheckboxFormField } from "../../forms/form-fields";
import { LegacyFormSubmitter } from "../../forms/legacy-form-submitter";
import { li18n } from "../../i18n-lingui";

import { MiddleProgressStep } from "../../progress/progress-step-route";
import {
  BlankEvictionFreeAgreeToLegalTermsInput,
  EvictionFreeAgreeToLegalTermsMutation,
} from "../../queries/EvictionFreeAgreeToLegalTermsMutation";
import { ProgressButtons } from "../../ui/buttons";
import Page from "../../ui/page";

export const EvictionFreeAgreeToLegalTerms = MiddleProgressStep((props) => (
  <Page
    title={li18n._(t`Agree to the state’s legal terms`)}
    withHeading="big"
    className="content"
  >
    <p>
      <Trans>
        These last questions make sure that you understand the limits of the
        protection granted by this form, and that you answered the previous
        questions truthfully:
      </Trans>
    </p>
    <LegacyFormSubmitter
      mutation={EvictionFreeAgreeToLegalTermsMutation}
      initialState={BlankEvictionFreeAgreeToLegalTermsInput}
      onSuccessRedirect={props.nextStep}
    >
      {(ctx) => (
        <>
          <CheckboxFormField
            {...ctx.fieldPropsFor("compliesWithOtherLawfulTerms")}
          >
            <Trans>
              I understand that I must comply with all other lawful terms under
              my tenancy, lease agreement or similar contract.
            </Trans>
          </CheckboxFormField>
          <CheckboxFormField
            {...ctx.fieldPropsFor("understandsFinancialObligations")}
          >
            <Trans id="evictionfree.legalAgreementCheckboxOnFees">
              I further understand that lawful fees, penalties or interest for
              not having paid rent in full or met other financial obligations as
              required by my tenancy, lease agreement or similar contract may
              still be charged or collected and may result in a monetary
              judgment against me.
            </Trans>
          </CheckboxFormField>
          <CheckboxFormField
            {...ctx.fieldPropsFor("understandsProtectionIsTemporary")}
          >
            <Trans id="evictionfree.legalAgreementCheckboxOnNewProtections">
              I further understand that my landlord may be able to seek eviction
              after May 1, 2021, and that the law may provide certain
              protections at that time that are separate from those available
              through this declaration.
            </Trans>
          </CheckboxFormField>
          <ProgressButtons back={props.prevStep} isLoading={ctx.isLoading} />
        </>
      )}
    </LegacyFormSubmitter>
  </Page>
));
