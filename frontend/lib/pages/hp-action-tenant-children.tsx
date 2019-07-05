import React from 'react';
import { TextualFormField } from '../form-fields';
import { TenantChildrenMutation, BlankChildrenTenantChildFormFormSetInput } from '../queries/TenantChildrenMutation';
import { Formset } from '../formset';
import { TENANT_CHILDREN_MAX_COUNT } from '../../../common-data/hp-action.json';
import { SessionStepBuilder } from '../session-step-builder';
import { FormsetItem, formsetItemProps } from '../formset-item';

const stepBuilder = new SessionStepBuilder(sess => sess.tenantChildren);

export const TenantChildren = stepBuilder.createStep({
  title: "Do any children live on the premises?",
  mutation: TenantChildrenMutation,
  toFormInput: tc => ({
    children: tc.data.map(child => ({...child, DELETE: false}))
  }),
  renderIntro: () => <>
    <p>If any children under the age of 6 live in the apartment, please list their names and birthdates here. Otherwise, you can continue to the next page.</p>
    <p><strong>Note:</strong> This information is important because children are very sensitive to lead, so the city wants to be able to give these cases special attention.</p>
    <p>Please list up to {TENANT_CHILDREN_MAX_COUNT} children under the age of 6 who live in the apartment.</p>
  </>,
  renderForm: ctx => <>
    <Formset {...ctx.formsetPropsFor('children')}
              maxNum={TENANT_CHILDREN_MAX_COUNT}
              extra={TENANT_CHILDREN_MAX_COUNT}
              emptyForm={BlankChildrenTenantChildFormFormSetInput}>
      {(ctx, i) =>
        <FormsetItem label={`Child #${i + 1} (optional)`} {...formsetItemProps(ctx)}>
          <div className="columns is-mobile is-marginless">
            <div className="column">
              <TextualFormField {...ctx.fieldPropsFor('name')} label="Full name" />
            </div>
            <div className="column">
              <TextualFormField {...ctx.fieldPropsFor('dob')} type="date" label="Date of birth" />
            </div>
          </div>
        </FormsetItem>
      }
    </Formset>
  </>
});
