import React from "react";
import { CheckboxFormField } from "../../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { EvictionFreeCovidImpactMutation } from "../../queries/EvictionFreeCovidImpactMutation";
import { Accordion } from "../../ui/accordion";
import { ProgressButtons } from "../../ui/buttons";
import Page from "../../ui/page";

export const EvictionFreeCovidImpact = MiddleProgressStep((props) => {
  const liStyle: React.CSSProperties = { fontWeight: "inherit" };

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
            <Accordion
              question="What does “financial hardship” mean?"
              extraClassName=""
            >
              <p>
                This means you are unable to pay your rent or other financial
                obligations under the lease in full or obtain alternative
                suitable permanent housing because of one or more of the
                following:
              </p>
              <ul className="jf-space-below-2rem">
                <li style={liStyle}>
                  Significant loss of household income during the COVID-19
                  pandemic.
                </li>
                <li style={liStyle}>
                  Increase in necessary out-of-pocket expenses related to
                  performing essential work or related to health impacts during
                  the COVID-19 pandemic.
                </li>
                <li style={liStyle}>
                  Childcare responsibilities or responsibilities to care for an
                  elderly, disabled, or sick family member during the COVID-19
                  pandemic have negatively affected your ability or the ability
                  of someone in your household to obtain meaningful employment
                  or earn income or increased your necessary out-of-pocket
                  expenses.
                </li>
                <li style={liStyle}>
                  Moving expenses and difficulty you have securing alternative
                  housing make it a hardship for you to relocate to another
                  residence during the COVID-19 pandemic.
                </li>
                <li style={liStyle}>
                  Other circumstances related to the COVID-19 pandemic have
                  negatively affected your ability to obtain meaningful
                  employment or earn income or have significantly reduced your
                  household income or significantly increased your expenses.
                </li>
                <li style={liStyle}>
                  To the extent that you have lost household income or had
                  increased expenses, any public assistance, including
                  unemployment insurance, pandemic unemployment assistance,
                  disability insurance, or paid family leave, that you have
                  received since the start of the COVID-19 pandemic does not
                  fully make up for your loss of household income or increased
                  expenses.
                </li>
              </ul>
            </Accordion>
            <Accordion question="What does “significant health risk” mean?">
              <p>
                This means vacating the premises and moving into new permanent
                housing would pose a significant health risk because you or one
                or more members of your household have an increased risk for
                severe illness or death from COVID-19 due to being over the age
                of sixty-five, having a disability or having an underlying
                medical condition, which may include but is not limited to being
                immunocompromised.
              </p>
            </Accordion>
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
