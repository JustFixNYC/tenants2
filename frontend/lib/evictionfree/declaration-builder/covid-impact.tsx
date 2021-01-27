import { t, Trans } from "@lingui/macro";
import React from "react";
import { CheckboxFormField } from "../../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { li18n } from "../../i18n-lingui";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { EvictionFreeCovidImpactMutation } from "../../queries/EvictionFreeCovidImpactMutation";
import { Accordion } from "../../ui/accordion";
import { ProgressButtons } from "../../ui/buttons";
import Page from "../../ui/page";

const FinancialHardshipAccordion: React.FC<{}> = () => (
  <Accordion
    isExpanded
    question={li18n._(t`What does “financial hardship” mean?`)}
  >
    <p>
      <Trans id="evictionfree.financialHardshipExplainer1">
        This means you are unable to pay your rent or other financial
        obligations under the lease in full or obtain alternative suitable
        permanent housing because of one or more of the following:
      </Trans>
    </p>
    <ul className="jf-space-below-2rem">
      <Trans id="evictionfree.financialHardshipExplainer2">
        <li>
          Significant loss of household income during the COVID-19 pandemic.
        </li>
        <li>
          Increase in necessary out-of-pocket expenses related to performing
          essential work or related to health impacts during the COVID-19
          pandemic.
        </li>
        <li>
          Childcare responsibilities or responsibilities to care for an elderly,
          disabled, or sick family member during the COVID-19 pandemic have
          negatively affected your ability or the ability of someone in your
          household to obtain meaningful employment or earn income or increased
          your necessary out-of-pocket expenses.
        </li>
        <li>
          Moving expenses and difficulty you have securing alternative housing
          make it a hardship for you to relocate to another residence during the
          COVID-19 pandemic.
        </li>
        <li>
          Other circumstances related to the COVID-19 pandemic have negatively
          affected your ability to obtain meaningful employment or earn income
          or have significantly reduced your household income or significantly
          increased your expenses.
        </li>
        <li>
          To the extent that you have lost household income or had increased
          expenses, any public assistance, including unemployment insurance,
          pandemic unemployment assistance, disability insurance, or paid family
          leave, that you have received since the start of the COVID-19 pandemic
          does not fully make up for your loss of household income or increased
          expenses.
        </li>
      </Trans>
    </ul>
  </Accordion>
);

const HealthRiskAccordion: React.FC<{}> = () => (
  <Accordion
    isExpanded
    question={li18n._(t`What does “significant health risk” mean?`)}
  >
    <p>
      <Trans id="evictionfree.significantHealthRiskExplainer">
        This means you or one or more members of your household have an
        increased risk for severe illness or death from COVID-19 due to being
        over the age of sixty-five, having a disability or having an underlying
        medical condition, which may include but is not limited to being
        immunocompromised.
      </Trans>
    </p>
  </Accordion>
);

export const EvictionFreeCovidImpact = MiddleProgressStep((props) => {
  return (
    <Page
      title={li18n._(t`Which hardship situation applies to you?`)}
      withHeading="big"
      className="content"
    >
      <p>
        <Trans>
          Check any or all that apply. Note: You{" "}
          <strong>must select at least one box</strong> in order to qualify for
          the State's eviction protections.
        </Trans>
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
            <CheckboxFormField
              {...ctx.fieldPropsFor("hasHealthRisk")}
              extraContentAfterLabel={<HealthRiskAccordion />}
            >
              <Trans>
                Vacating the premises and moving into new permanent housing
                would pose a significant health risk due to COVID-19.
              </Trans>
            </CheckboxFormField>
            <CheckboxFormField
              {...ctx.fieldPropsFor("hasFinancialHardship")}
              extraContentAfterLabel={<FinancialHardshipAccordion />}
            >
              <Trans>
                I am experiencing financial hardship due to COVID-19.
              </Trans>
            </CheckboxFormField>
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
