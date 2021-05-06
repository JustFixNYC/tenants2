import { t, Trans } from "@lingui/macro";
import React from "react";
import { CheckboxFormField } from "../../forms/form-fields";
import { LegacyFormSubmitter } from "../../forms/legacy-form-submitter";
import { li18n } from "../../i18n-lingui";

import {
  BlankEvictionFreeAgreeToLegalTermsInput,
  EvictionFreeAgreeToLegalTermsMutation,
} from "../../queries/EvictionFreeAgreeToLegalTermsMutation";
import { ProgressButtons } from "../../ui/buttons";
import { EnglishOutboundLink } from "../../ui/localized-outbound-link";
import Page from "../../ui/page";
import { EvictionFreeNotSentDeclarationStep } from "./step-decorators";

export const EvictionFreeAgreeToLegalTerms = EvictionFreeNotSentDeclarationStep(
  (props) => (
    <Page
      title={li18n._(t`Agree to the state’s legal terms`)}
      withHeading="big"
      className="content"
    >
      <p>
        <Trans id="evictionfree.agreeToStateTermsIntro">
          These last questions make sure that you understand the limits of the
          protection granted by this hardship declaration form, and that you
          answered the previous questions truthfully:
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
                I understand that I must comply with all other lawful terms
                under my tenancy, lease agreement or similar contract.
              </Trans>
            </CheckboxFormField>
            <CheckboxFormField
              {...ctx.fieldPropsFor("understandsFinancialObligations")}
            >
              <Trans id="evictionfree.legalAgreementCheckboxOnFees">
                I further understand that lawful fees, penalties or interest for
                not having paid rent in full or met other financial obligations
                as required by my tenancy, lease agreement or similar contract
                may still be charged or collected and may result in a monetary
                judgment against me.
              </Trans>
            </CheckboxFormField>
            <CheckboxFormField
              {...ctx.fieldPropsFor("understandsProtectionIsTemporary")}
            >
              <p className="is-size-6">
                <Trans id="evictionfree.legalAgreementCheckboxOnNewProtections1">
                  I further understand that my landlord may be able to seek
                  eviction after May 1, 2021, and that the law may provide
                  certain protections at that time that are separate from those
                  available through this declaration.
                </Trans>
              </p>
              <p className="is-size-6 is-italic">
                *
                <Trans id="evictionFreeMay1DisclaimerNextToCheckbox">
                  Although this version of the Hardship Declaration still states
                  that these tenant protections end "May 1, 2021," the State of
                  New York has{" "}
                  <EnglishOutboundLink href="https://www.nysenate.gov/legislation/bills/2021/A7175">
                    extended these protections
                  </EnglishOutboundLink>{" "}
                  until <b>August 31, 2021</b>. By filling out this form, these
                  protections from eviction for tenants now extend to August 31,
                  2021.
                </Trans>
              </p>
            </CheckboxFormField>

            <ProgressButtons back={props.prevStep} isLoading={ctx.isLoading} />
          </>
        )}
      </LegacyFormSubmitter>
    </Page>
  )
);
