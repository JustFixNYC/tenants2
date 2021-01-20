import React from "react";
import { CheckboxFormField } from "../../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { EvictionFreeCovidImpactMutation } from "../../queries/EvictionFreeCovidImpactMutation";
import { ProgressButtons } from "../../ui/buttons";
import Page from "../../ui/page";

export const EvictionFreeCovidImpact = MiddleProgressStep((props) => {
  return (
    <Page
      title="Which hardship situation applies to you?"
      withHeading="big"
      className="content"
    >
      <p>
        Check any or all that apply. Note: You{" "}
        <strong>must select at least one box</strong> in order to qualify for
        the State's eviction protections.
      </p>
      <SessionUpdatingFormSubmitter
        mutation={EvictionFreeCovidImpactMutation}
        initialState={(s) => ({
          hasFinancialHardship:
            s.hardshipDeclarationDetails?.hasFinancialHardship ?? false,
          hasHealthRisk: s.hardshipDeclarationDetails?.hasHealthRisk ?? false,
        })}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <>
            <CheckboxFormField {...ctx.fieldPropsFor("hasFinancialHardship")}>
              I am experiencing financial hardship due to COVID-19.
            </CheckboxFormField>
            <CheckboxFormField {...ctx.fieldPropsFor("hasHealthRisk")}>
              Vacating the premises and moving into new permanent housing would
              pose a significant health risk due to COVID-19.
            </CheckboxFormField>
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
