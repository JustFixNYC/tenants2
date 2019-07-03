import React from 'react';
import { SessionStepBuilder } from '../session-step-builder';
import { PriorHpActionCasesMutation, BlankCasesPriorCaseFormFormSetInput } from '../queries/PriorHpActionCasesMutation';
import { CasesPriorCaseFormFormSetInput } from '../queries/globalTypes';
import { TextualFormField, HiddenFormField, CheckboxFormField } from '../form-fields';
import { Formset } from '../formset';
import { BaseFormContext } from '../form-context';

const stepBuilder = new SessionStepBuilder(sess => sess.priorHpActionCases);

function renderPriorCase(ctx: BaseFormContext<CasesPriorCaseFormFormSetInput>, i: number) {
  const idProps = ctx.fieldPropsFor('id');
  const deleteProps = ctx.fieldPropsFor('DELETE');

  return <>
    <h2 className="subtitle is-5 is-marginless">
      Prior case #{i + 1} (optional)
    </h2>
    <HiddenFormField {...idProps} />
    <div className="columns is-mobile is-marginless">
      <div className="column">
        <TextualFormField {...ctx.fieldPropsFor('caseNumber')} label="Case number" />
      </div>
      <div className="column">
        <TextualFormField {...ctx.fieldPropsFor('caseDate')} type="date" label="Date" />
      </div>
    </div>
    <div className="columns is-mobile is-marginless">
      <div className="column">
        <fieldset className="field">
          <legend>What did you sue your landlord for?</legend>
          <CheckboxFormField {...ctx.fieldPropsFor('isHarassment')}>Harassment</CheckboxFormField>
          <CheckboxFormField {...ctx.fieldPropsFor('isRepairs')}>Repairs</CheckboxFormField>
        </fieldset>
      </div>
    </div>
    {idProps.value
      ? <CheckboxFormField {...deleteProps}>Delete</CheckboxFormField>
      : <HiddenFormField {...deleteProps} />}
  </>;
}

export const HarassmentCaseHistory = stepBuilder.createStep(props => ({
  title: "Case history",
  mutation: PriorHpActionCasesMutation,
  toFormInput: pc => ({
    cases: pc.data.map(priorCase => ({...priorCase, DELETE: false}))
  }),
  renderIntro: () => <>
    <p>If you have brought any cases in housing court against this landlord for harassment or repairs before this case, please list them below.</p>
  </>,
  renderForm: ctx => <>
    <Formset {...ctx.formsetPropsFor('cases')} emptyForm={BlankCasesPriorCaseFormFormSetInput}>
      {renderPriorCase}
    </Formset>
  </>
}));
