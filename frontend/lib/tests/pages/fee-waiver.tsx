import React from 'react';

import { FeeWaiverInput } from "../../queries/globalTypes";
import Page from "../../page";
import { SessionUpdatingFormSubmitter } from '../../forms';
import { FeeWaiverMutation } from '../../queries/FeeWaiverMutation';
import Routes from '../../routes';
import { RadiosFormField, CheckboxFormField, YesNoRadiosFormField } from '../../form-fields';
import { toDjangoChoices } from '../../common-data';
import { IncomeFrequencyChoices, getIncomeFrequencyChoiceLabels } from '../../../../common-data/income-frequency-choices';
import { BackButton, NextButton } from '../../buttons';
import { AllSessionInfo } from '../../queries/AllSessionInfo';
import { CurrencyFormField } from '../../currency-form-field';
import { FormInputConverter } from '../../form-input-converter';

const INITIAL_FEE_WAIVER_STATE: FeeWaiverInput = {
  incomeFrequency: '',
  incomeAmount: '',
  incomeSrcEmployment: false,
  incomeSrcHra: false,
  incomeSrcChildSupport: false,
  incomeSrcAlimony: false,
  rentAmount: '',
  expenseUtilities: false,
  expenseCable: false,
  expenseChildcare: false,
  expensePhone: false,
  askedBefore: ''
};

function getInitialState({ feeWaiver }: AllSessionInfo): FeeWaiverInput {
  return feeWaiver
    ? new FormInputConverter(feeWaiver).yesNoRadios('askedBefore').finish()
    : INITIAL_FEE_WAIVER_STATE;
}

export const FeeWaiver = () => (
  <Page title="It's fee waiver time!">
    <h1 className="title is-4">It's fee waiver time!</h1>
    <p>We can create a petition for you to ask the court to waive the $45 filing fee. The court needs some information about your finances to make their decision.</p>
    <br/>
    <SessionUpdatingFormSubmitter
      mutation={FeeWaiverMutation}
      initialState={getInitialState}
      onSuccessRedirect={Routes.locale.hp.yourLandlord}
    >
      {(ctx) => <>
        <CurrencyFormField
          label="What is your monthly income?"
          {...ctx.fieldPropsFor('incomeAmount')}
        />
        <fieldset className="field">
          <legend>Where do you receive your income from? Select all that apply.</legend>
          <CheckboxFormField {...ctx.fieldPropsFor('incomeSrcEmployment')}>
            Employment
          </CheckboxFormField>
          <CheckboxFormField {...ctx.fieldPropsFor('incomeSrcHra')}>
            HRA
          </CheckboxFormField>
          <CheckboxFormField {...ctx.fieldPropsFor('incomeSrcChildSupport')}>
            Child support
          </CheckboxFormField>
          <CheckboxFormField {...ctx.fieldPropsFor('incomeSrcChildSupport')}>
            Alimony
          </CheckboxFormField>
        </fieldset>
        <RadiosFormField
          label="How often do you get paid?"
          choices={toDjangoChoices(
            IncomeFrequencyChoices,
            getIncomeFrequencyChoiceLabels()
          )}
          {...ctx.fieldPropsFor('incomeFrequency')}
        />
        <CurrencyFormField
          label="How much do you pay in rent?"
          {...ctx.fieldPropsFor('rentAmount')}
        />
        <fieldset className="field">
          <legend>What are your expenses?</legend>
          <CheckboxFormField {...ctx.fieldPropsFor('expenseUtilities')}>
            Utilities
          </CheckboxFormField>
          <CheckboxFormField {...ctx.fieldPropsFor('expenseCable')}>
            Cable
          </CheckboxFormField>
          <CheckboxFormField {...ctx.fieldPropsFor('expenseChildcare')}>
            Childcare
          </CheckboxFormField>
          <CheckboxFormField {...ctx.fieldPropsFor('expensePhone')}>
            Phone
          </CheckboxFormField>
        </fieldset>
        <br/>
        <YesNoRadiosFormField {...ctx.fieldPropsFor('askedBefore')} label="Have you asked for a fee waiver before?" />
        <div className="buttons jf-two-buttons">
          <BackButton to={Routes.locale.hp.issues.home} label="Back" />
          <NextButton isLoading={ctx.isLoading} label="Next"/>
        </div>
      </>}
    </SessionUpdatingFormSubmitter>
  </Page>
);
