import React from "react";
import { SessionStepBuilder } from "../progress/session-step-builder";
import {
  PriorHpActionCasesMutation,
  BlankCasesPriorCaseFormFormSetInput,
} from "../queries/PriorHpActionCasesMutation";
import { TextualFormField, CheckboxFormField } from "../forms/form-fields";
import { Formset } from "../forms/formset";
import { FormsetItem, formsetItemProps } from "../forms/formset-item";

const stepBuilder = new SessionStepBuilder((sess) => sess.priorHpActionCases);

export const HarassmentCaseHistory = stepBuilder.createStep(
  PriorHpActionCasesMutation,
  (props) => ({
    title: "Previous case history (optional)",
    toFormInput: (pc) => ({
      cases: pc.data.map((priorCase) => ({ ...priorCase, DELETE: false })),
    }),
    renderIntro: () => (
      <>
        <p>
          If you have brought any cases in housing court against this landlord
          for harassment or repairs before this case, please list them below. If
          not, you may skip this question.
        </p>
      </>
    ),
    renderForm: (ctx) => (
      <>
        <Formset
          {...ctx.formsetPropsFor("cases")}
          emptyForm={BlankCasesPriorCaseFormFormSetInput}
        >
          {(ctx, i) => (
            <FormsetItem
              {...formsetItemProps(ctx)}
              label={`Prior case #${i + 1} (optional)`}
            >
              <div className="columns is-mobile is-marginless">
                <div className="column">
                  <TextualFormField
                    {...ctx.fieldPropsFor("caseNumber")}
                    label="Case number (9 digits)"
                    help="This is sometimes called the &ldquo;index number&rdquo;."
                  />
                </div>
                <div className="column">
                  <TextualFormField
                    {...ctx.fieldPropsFor("caseDate")}
                    type="date"
                    label="Date"
                  />
                </div>
              </div>
              <div className="columns is-mobile is-marginless">
                <div className="column">
                  <fieldset className="field">
                    <legend>What did you sue your landlord for?</legend>
                    <CheckboxFormField {...ctx.fieldPropsFor("isHarassment")}>
                      Harassment
                    </CheckboxFormField>
                    <CheckboxFormField {...ctx.fieldPropsFor("isRepairs")}>
                      Repairs
                    </CheckboxFormField>
                  </fieldset>
                </div>
              </div>
            </FormsetItem>
          )}
        </Formset>
      </>
    ),
  })
);
