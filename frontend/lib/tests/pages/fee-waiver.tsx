import React from 'react';

import { FeeWaiverInput } from "../../queries/globalTypes";
import Page from "../../page";
import { SessionUpdatingFormSubmitter } from '../../forms';
import { FeeWaiverMutation } from '../../queries/FeeWaiverMutation';
import Routes from '../../routes';
import { CheckboxFormField, TextualFormField } from '../../form-fields';
import { YesNoRadiosFormField } from "../../yes-no-radios-form-field";
import { BackButton, NextButton } from '../../buttons';
import { AllSessionInfo } from '../../queries/AllSessionInfo';
import { CurrencyFormField } from '../../currency-form-field';
import { FormInputConverter } from '../../form-input-converter';

const INITIAL_FEE_WAIVER_STATE: FeeWaiverInput = {
  incomeAmountMonthly: '',
  incomeSrcEmployment: false,
  incomeSrcHra: false,
  incomeSrcChildSupport: false,
  incomeSrcAlimony: false,
  incomeSrcOther: '',
  rentAmount: '',
  expenseUtilities: '0.00',
  expenseCable: '0.00',
  expenseChildcare: '0.00',
  expensePhone: '0.00',
  expenseOther: '0.00',
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
          {...ctx.fieldPropsFor('incomeAmountMonthly')}
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
        <TextualFormField {...ctx.fieldPropsFor('incomeSrcOther')}
                          label="If you receive any other kind of income, please specify it below." />
        <CurrencyFormField
          label="How much do you pay in rent?"
          {...ctx.fieldPropsFor('rentAmount')}
        />
        <h2 className="title is-5">What are your expenses?</h2>
        <CurrencyFormField label="Utilities expenses" {...ctx.fieldPropsFor('expenseUtilities')} />
        <CurrencyFormField label="Cable expenses" {...ctx.fieldPropsFor('expenseCable')} />
        <CurrencyFormField label="Childcare expenses" {...ctx.fieldPropsFor('expenseChildcare')} />
        <CurrencyFormField label="Phone expenses" {...ctx.fieldPropsFor('expensePhone')} />
        <CurrencyFormField label="Other expenses" {...ctx.fieldPropsFor('expenseOther')} />
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
