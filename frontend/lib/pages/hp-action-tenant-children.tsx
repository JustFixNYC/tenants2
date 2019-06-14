import React from 'react';
import { BaseFormContext, SessionUpdatingFormSubmitter } from '../forms';
import { ChildrenTenantChildFormFormSetInput, tenantChildrenInput } from '../queries/globalTypes';
import { HiddenFormField, TextualFormField, CheckboxFormField } from '../form-fields';
import { AllSessionInfo } from '../queries/AllSessionInfo';
import { BlanktenantChildrenInput, TenantChildrenMutation } from '../queries/TenantChildrenMutation';
import { ProgressStepProps } from '../progress-step-route';
import Page from '../page';
import { assertNotNull } from '../util';
import { Formset } from '../formset';
import { maxChildren } from '../../../common-data/hp-action.json';
import { BackButton, NextButton } from '../buttons';

function renderTenantChild(ctx: BaseFormContext<ChildrenTenantChildFormFormSetInput>, i: number) {
  const idProps = ctx.fieldPropsFor('id');
  const deleteProps = ctx.fieldPropsFor('DELETE');

  return <>
    <h2 className="subtitle is-5">Child #{i + 1}</h2>
    <HiddenFormField {...idProps} />
    <div className="columns is-mobile">
      <div className="column">
        <TextualFormField {...ctx.fieldPropsFor('name')} label="Name" />
      </div>
      <div className="column">
        <TextualFormField {...ctx.fieldPropsFor('dob')} type="date" label="Date of birth" />
      </div>
    </div>
    {idProps.value
      ? <CheckboxFormField {...deleteProps}>Delete</CheckboxFormField>
      : <HiddenFormField {...deleteProps} />}
  </>;
}

function getInitialTenantChildren(session: AllSessionInfo): tenantChildrenInput {
  const { tenantChildren } = session;
  if (tenantChildren) {
    return {children: tenantChildren.map(child => ({...child, DELETE: false}))};
  }
  return BlanktenantChildrenInput;
}

export const TenantChildren = (props: ProgressStepProps) => {
  return (
    <Page title="Children on premises" withHeading>
      <div className="content">
        <p>If any children under the age of 6 live in the apartment, please list their names and birthdates here. Otherwise, you can continue to the next page.</p>
        <p><strong>Note:</strong> This information is important because children are very sensitive to lead, so the city wants to be able to give these cases special attention.</p>
        <p>Please list up to {maxChildren} children under the age of 6 who live in the apartment.</p>
      </div>
      <SessionUpdatingFormSubmitter
        mutation={TenantChildrenMutation}
        initialState={getInitialTenantChildren}
        onSuccessRedirect={assertNotNull(props.nextStep)}
      >
        {(formCtx) => <>
          <Formset {...formCtx.formsetPropsFor('children')}
                   maxNum={maxChildren}
                   extra={maxChildren}
                   emptyForm={{name: '', dob: '', DELETE: false}}>
            {renderTenantChild}
          </Formset>
          <div className="buttons jf-two-buttons">
            <BackButton to={assertNotNull(props.prevStep)} label="Back" />
            <NextButton isLoading={formCtx.isLoading} />
          </div>
        </>}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
};
