import React from 'react';

import { FeeWaiverExpensesInput } from "../queries/globalTypes";
import Page from "../page";
import { SessionUpdatingFormSubmitter } from '../forms';
import { CheckboxFormField } from '../form-fields';
import { YesNoRadiosFormField } from "../yes-no-radios-form-field";
import { BackButton, NextButton, CenteredPrimaryButtonLink } from '../buttons';
import { CurrencyFormField } from '../currency-form-field';
import { getInitialFormInput } from '../form-input-converter';
import { FeeWaiverMiscMutation, BlankFeeWaiverMiscInput } from '../queries/FeeWaiverMiscMutation';
import { FeeWaiverIncomeMutation, BlankFeeWaiverIncomeInput } from '../queries/FeeWaiverIncomeMutation';
import { FeeWaiverExpensesMutation, BlankFeeWaiverExpensesInput } from '../queries/FeeWaiverExpensesMutation';
import { ProgressiveOtherCheckboxFormField } from '../other-checkbox-form-field';
import { ProgressStepProps } from '../progress-step-route';
import { assertNotNull } from '../util';
import { FeeWaiverPublicAssistanceMutation, BlankFeeWaiverPublicAssistanceInput } from '../queries/FeeWaiverPublicAssistanceMutation';
import { Link } from 'react-router-dom';
import Routes from '../routes';
import { bulmaClasses } from '../bulma';

const INITIAL_EXPENSES_STATE: FeeWaiverExpensesInput = {
  ...BlankFeeWaiverExpensesInput,
  expenseUtilities: '0.00',
  expenseCable: '0.00',
  expenseChildcare: '0.00',
  expensePhone: '0.00',
  expenseOther: '0.00',
};

export const FeeWaiverStart = (props: ProgressStepProps) => (
  <Page title="Requesting Not to Pay the $45 Filing Fee">
    <h1 className="title is-4">Requesting Not to Pay the $45 Filing Fee</h1>
    <p>We can create a petition for you to ask the court to waive the $45 filing fee. The court needs some information about your finances to make their decision.</p>
    <br/>
    <CenteredPrimaryButtonLink className="is-large" to={assertNotNull(props.nextStep)}>
      Ask the court to waive the filing fee
    </CenteredPrimaryButtonLink>
    <div className="buttons jf-two-buttons jf-two-buttons--vertical">
      <BackButton to={assertNotNull(props.prevStep)} />
      <Link to={Routes.locale.hp.yourLandlord} className={bulmaClasses('button', 'is-light', 'is-medium')}>Skip</Link>
    </div>
  </Page>
);

export const FeeWaiverMisc = (props: ProgressStepProps) => (
  <Page title="Prior fee waivers">
    <h1 className="title is-4">Prior fee waivers</h1>
    <SessionUpdatingFormSubmitter
      mutation={FeeWaiverMiscMutation}
      initialState={({ feeWaiver }) => getInitialFormInput(
        feeWaiver,
        BlankFeeWaiverMiscInput,
        (feeWaiver) => feeWaiver.yesNoRadios('askedBefore').finish()
      )}
      onSuccessRedirect={assertNotNull(props.nextStep)}
    >
      {(ctx) => <>
        <YesNoRadiosFormField {...ctx.fieldPropsFor('askedBefore')} label="Have you asked for a fee waiver before?" />
        <div className="buttons jf-two-buttons">
          <BackButton to={assertNotNull(props.prevStep)} />
          <NextButton isLoading={ctx.isLoading} label="Next"/>
        </div>
      </>}
    </SessionUpdatingFormSubmitter>
  </Page>
);

export const FeeWaiverPublicAssistance = (props: ProgressStepProps) => (
  <Page title="Public assistance">
    <h1 className="title is-4">Public assistance</h1>
    <br/>
    <SessionUpdatingFormSubmitter
      mutation={FeeWaiverPublicAssistanceMutation}
      initialState={({ feeWaiver }) => getInitialFormInput(
        feeWaiver,
        BlankFeeWaiverPublicAssistanceInput,
        (feeWaiver) => feeWaiver.yesNoRadios('receivesPublicAssistance').finish()
      )}
      onSuccessRedirect={assertNotNull(props.nextStep)}
    >
      {(ctx) => <>
        <YesNoRadiosFormField {...ctx.fieldPropsFor('receivesPublicAssistance')} label="Do you receive public assistance?" />
        <div className="buttons jf-two-buttons">
          <BackButton to={assertNotNull(props.prevStep)} />
          <NextButton isLoading={ctx.isLoading} label="Next"/>
        </div>
      </>}
    </SessionUpdatingFormSubmitter>
  </Page>
);

export const FeeWaiverIncome = (props: ProgressStepProps) => (
  <Page title="Your income">
    <h1 className="title is-4">Your income</h1>
    <SessionUpdatingFormSubmitter
      mutation={FeeWaiverIncomeMutation}
      initialState={({ feeWaiver }) => getInitialFormInput(
        feeWaiver,
        BlankFeeWaiverIncomeInput,
        (feeWaiver) => feeWaiver.finish()
      )}
      onSuccessRedirect={assertNotNull(props.nextStep)}
    >
      {(ctx) => <>
        <CurrencyFormField
          label="What is your monthly income?"
          {...ctx.fieldPropsFor('incomeAmountMonthly')}
        />
        <fieldset className="field">
          <legend>Where do you receive your income from? You can select more than one.</legend>
          <CheckboxFormField {...ctx.fieldPropsFor('incomeSrcEmployment')}>
            Employment
          </CheckboxFormField>
          <CheckboxFormField {...ctx.fieldPropsFor('incomeSrcHra')}>
            HRA
          </CheckboxFormField>
          <CheckboxFormField {...ctx.fieldPropsFor('incomeSrcChildSupport')}>
            Child support
          </CheckboxFormField>
          <CheckboxFormField {...ctx.fieldPropsFor('incomeSrcAlimony')}>
            Alimony
          </CheckboxFormField>
          <ProgressiveOtherCheckboxFormField {...ctx.fieldPropsFor('incomeSrcOther')}
            baselineLabel="If you have other sources of income, please specify them."
            enhancedLabel="Please specify your other sources of income." />
        </fieldset>
        <div className="buttons jf-two-buttons">
          <BackButton to={assertNotNull(props.prevStep)} />
          <NextButton isLoading={ctx.isLoading} label="Next"/>
        </div>
      </>}
    </SessionUpdatingFormSubmitter>
  </Page>
);

export const FeeWaiverExpenses = (props: ProgressStepProps) => (
  <Page title="Your expenses">
    <h1 className="title is-4">Your expenses</h1>
    <SessionUpdatingFormSubmitter
      mutation={FeeWaiverExpensesMutation}
      initialState={({ feeWaiver }) => getInitialFormInput(
        feeWaiver,
        INITIAL_EXPENSES_STATE,
        (feeWaiver) => feeWaiver.finish()
      )}
      onSuccessRedirect={assertNotNull(props.nextStep)}
    >
      {(ctx) => <>
        <CurrencyFormField
          label="How much do you pay in rent?"
          {...ctx.fieldPropsFor('rentAmount')}
        />
        <br/>
        <h2 className="title is-5">What are your expenses?</h2>
        <CurrencyFormField label="Utilities" {...ctx.fieldPropsFor('expenseUtilities')} />
        <CurrencyFormField label="Cable/TV" {...ctx.fieldPropsFor('expenseCable')} />
        <CurrencyFormField label="Childcare" {...ctx.fieldPropsFor('expenseChildcare')} />
        <CurrencyFormField label="Phone" {...ctx.fieldPropsFor('expensePhone')} />
        <CurrencyFormField label="Other" {...ctx.fieldPropsFor('expenseOther')} />
        <br/>
        <div className="buttons jf-two-buttons">
          <BackButton to={assertNotNull(props.prevStep)} />
          <NextButton isLoading={ctx.isLoading} label="Next"/>
        </div>
      </>}
    </SessionUpdatingFormSubmitter>
  </Page>
);
